export type UpscaleMode = "none" | "fast" | "ai";
export class GPUUpscaleError extends Error {}
export interface Raster {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}
export function upscaleDimensions(width: number, height: number) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height * 4 > 32000000 ||
    Math.max(width, height) * 2 > 16384
  )
    throw new Error(
      "2x output is limited to 32 megapixels and 16384 pixels per side. Crop the image or use a smaller source.",
    );
  return { width: width * 2, height: height * 2 };
}
/** Catmull-Rom bicubic resampling in premultiplied alpha; no invented detail. */
export function fastUpscale(input: Raster): Raster {
  const { width, height } = upscaleDimensions(input.width, input.height);
  const pixels = new Uint8ClampedArray(width * height * 4);
  const kernel = (v: number) => {
    const x = Math.abs(v);
    return x <= 1
      ? 1.5 * x * x * x - 2.5 * x * x + 1
      : x < 2
        ? -0.5 * x * x * x + 2.5 * x * x - 4 * x + 2
        : 0;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = (x + 0.5) / 2 - 0.5,
        sy = (y + 0.5) / 2 - 0.5,
        ix = Math.floor(sx),
        iy = Math.floor(sy);
      let alpha = 0,
        r = 0,
        g = 0,
        b = 0;
      for (let j = -1; j <= 2; j++)
        for (let i = -1; i <= 2; i++) {
          const n =
            (Math.max(0, Math.min(input.height - 1, iy + j)) * input.width +
              Math.max(0, Math.min(input.width - 1, ix + i))) *
            4;
          const a =
            input.pixels[n + 3] * kernel(sx - ix - i) * kernel(sy - iy - j);
          alpha += a;
          r += input.pixels[n] * a;
          g += input.pixels[n + 1] * a;
          b += input.pixels[n + 2] * a;
        }
      const d = (y * width + x) * 4;
      pixels[d + 3] = alpha;
      if (alpha > 1e-6) {
        pixels[d] = r / alpha;
        pixels[d + 1] = g / alpha;
        pixels[d + 2] = b / alpha;
      }
    }
  return { pixels, width, height };
}
export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export function* tiles(
  width: number,
  height: number,
  core = 128,
  pad = 32,
): Generator<Tile> {
  for (let y = 0; y < height; y += core)
    for (let x = 0; x < width; x += core) {
      const w = Math.min(core, width - x),
        h = Math.min(core, height - y);
      yield {
        x,
        y,
        width: w,
        height: h,
        left: Math.max(0, x - pad),
        top: Math.max(0, y - pad),
        right: Math.min(width, x + w + pad),
        bottom: Math.min(height, y + h + pad),
      };
    }
}
export type Infer = (
  rgb: Uint8ClampedArray,
  width: number,
  height: number,
) => Promise<{
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: number;
}>;
/** Crop overlapping halos; model padding is discarded, never stitched as content. */
export async function tiledUpscale(
  input: Raster,
  infer: Infer,
  progress: (v: number) => void = () => {},
): Promise<Raster> {
  // Neural RGB reconstruction is nonlinear: unpremultiplying it is invalid.
  if (input.pixels.some((v, i) => i % 4 === 3 && v !== 255))
    throw new Error(
      "AI upscaling requires an opaque photograph. Use Fast for transparency.",
    );
  const dimensions = upscaleDimensions(input.width, input.height);
  const output = {
      ...dimensions,
      pixels: new Uint8ClampedArray(dimensions.width * dimensions.height * 4),
    },
    total = Math.ceil(input.width / 128) * Math.ceil(input.height / 128);
  let done = 0;
  for (const t of tiles(input.width, input.height)) {
    const w = t.right - t.left,
      h = t.bottom - t.top,
      rgb = new Uint8ClampedArray(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const s = ((t.top + y) * input.width + t.left + x) * 4,
          d = (y * w + x) * 3;
        // Transparent color is composited over black rather than leaking hidden RGB.
        for (let c = 0; c < 3; c++) rgb[d + c] = input.pixels[s + c];
      }
    const result = await infer(rgb, w, h);
    if (
      (result.width !== w * 2 && result.width !== Math.ceil(w / 8) * 16) ||
      (result.height !== h * 2 && result.height !== Math.ceil(h / 8) * 16) ||
      result.channels !== 3 ||
      result.data.length !== result.width * result.height * 3
    )
      throw new Error("The AI model returned an unexpected 2x tile.");
    for (let y = 0; y < t.height * 2; y++)
      for (let x = 0; x < t.width * 2; x++) {
        const s =
            (((t.y - t.top) * 2 + y) * result.width + (t.x - t.left) * 2 + x) *
            3,
          d = ((t.y * 2 + y) * output.width + t.x * 2 + x) * 4;
        output.pixels[d + 3] = 255;
        for (let c = 0; c < 3; c++) output.pixels[d + c] = result.data[s + c];
      }
    progress(++done / total);
  }
  return output;
}
export async function aiUpscale(
  input: Raster,
  backend: "auto" | "wasm",
  progress: (v: number) => void,
  reportBackend: (backend:string)=>void = ()=>{},
): Promise<Raster> {
  upscaleDimensions(input.width, input.height);
  const { pipeline, RawImage, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm!.numThreads = 1;
  let device: "webgpu" | "wasm" = "wasm";
  if (backend !== "wasm" && "gpu" in navigator) {
    const gpu = navigator.gpu as { requestAdapter: () => Promise<unknown> };
    try {
      if (await gpu.requestAdapter()) device = "webgpu";
    } catch {}
  }
  reportBackend(device);
  const create = pipeline as unknown as (
    task: string,
    model: string,
    options: object,
  ) => Promise<{
    (
      image: InstanceType<typeof RawImage>,
    ): Promise<InstanceType<typeof RawImage>>;
    dispose(): Promise<void>;
  }>;
  try {
    const model = await create(
      "image-to-image",
      "Xenova/swin2SR-lightweight-x2-64",
      {
        device,
        dtype: "fp32",
        progress_callback: (p: { status: string; progress?: number }) => {
          if (p.status === "progress")
            progress(Math.min(0.15, ((p.progress ?? 0) / 100) * 0.15));
        },
      },
    );
    // The owning worker is terminated by the client on completion or failure,
    // freeing the inference session without risking stalled GPU disposal.
    return await tiledUpscale(
      input,
      async (rgb, w, h) => model(new RawImage(rgb, w, h, 3)),
      (v) => progress(0.15 + v * 0.85),
    );
  } catch (error) {
    if (device === "webgpu")
      throw new GPUUpscaleError(
        error instanceof Error ? error.message : "GPU upscaling failed",
      );
    throw error;
  }
}
