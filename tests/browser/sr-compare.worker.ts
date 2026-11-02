/// <reference lib="webworker" />
import {
  tiledUpscale,
  type Raster,
  type UpscaleMetrics,
} from "../../src/processing/upscale";
import {
  candidateUrl,
  candidateHash,
  packRgb,
  reduceOutput,
} from "./sr-candidate";
let infer:
  | ((
      rgb: Uint8ClampedArray,
      w: number,
      h: number,
    ) => Promise<{
      data: Uint8ClampedArray | Uint8Array;
      width: number;
      height: number;
      channels: number;
    }>)
  | undefined;
let busy = false;
self.onmessage = async ({ data: m }) => {
  if (busy) {
    self.postMessage({ error: "Benchmark worker is already processing" });
    return;
  }
  busy = true;
  try {
    const started = performance.now(),
      warm = !!infer;
    const backend = m.backend as "webgpu" | "wasm";
    if (backend !== "webgpu" && backend !== "wasm")
      throw new Error("Select WebGPU or WASM explicitly");
    if (backend === "webgpu") {
      const gpu = (
        navigator as unknown as {
          gpu?: { requestAdapter: () => Promise<unknown> };
        }
      ).gpu;
      if (!gpu || !(await gpu.requestAdapter()))
        throw new Error("WebGPU unavailable. No CPU fallback was substituted.");
    }
    self.postMessage({
      status: `${m.model}: ${warm ? "warm session" : "loading"} / ${backend}`,
    });
    const loadStart = performance.now();
    if (!infer) {
      if (m.model === "swin") {
        const { pipeline, RawImage, env } =
          await import("@huggingface/transformers");
        env.allowLocalModels = false;
        env.backends.onnx.wasm!.numThreads = 1;
        const create = pipeline as unknown as (
          task: string,
          name: string,
          opts: object,
        ) => Promise<
          (
            image: unknown,
          ) => Promise<{
            data: Uint8ClampedArray;
            width: number;
            height: number;
            channels: number;
          }>
        >;
        const model = await create(
          "image-to-image",
          "Xenova/swin2SR-lightweight-x2-64",
          { device: backend, dtype: "fp32" },
        );
        infer = async (rgb, w, h) => model(new RawImage(rgb, w, h, 3));
      } else {
        const ort = await import("onnxruntime-web/webgpu");
        ort.env.wasm.numThreads = 1;
        const response = await fetch(candidateUrl);
        if (!response.ok)
          throw new Error(`Model download: HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
          (v) => v.toString(16).padStart(2, "0"),
        ).join("");
        if (hash !== candidateHash)
          throw new Error("Candidate model checksum mismatch");
        const session = await ort.InferenceSession.create(bytes, {
          executionProviders: [backend],
          graphOptimizationLevel: "all",
        });
        infer = async (rgb, w, h) => {
          const input = new ort.Tensor("float32", packRgb(rgb, w, h), [
            1,
            3,
            h,
            w,
          ]);
          let outputs:
            Record<string, InstanceType<typeof ort.Tensor>> | undefined;
          try {
            const result = await session.run({
              [session.inputNames[0]]: input,
            });
            outputs = result;
            const output = result[session.outputNames[0]];
            if (output.type !== "float32")
              throw new Error("Expected FP32 output");
            return reduceOutput(output.data as Float32Array, output.dims, w, h);
          } finally {
            input.dispose();
            if (outputs)
              for (const output of Object.values(outputs)) output.dispose();
          }
        };
      }
    }
    const metrics: UpscaleMetrics = {
      backend,
      warm,
      loadMs: performance.now() - loadStart,
      packMs: 0,
      inferenceMs: 0,
      stitchMs: 0,
      tiles: 0,
    };
    const result = await tiledUpscale(
      m.input as Raster,
      infer,
      (p) => self.postMessage({ progress: p, metrics: { ...metrics } }),
      metrics,
    );
    self.postMessage({ result, metrics, wallMs: performance.now() - started }, [
      result.pixels.buffer,
    ]);
  } catch (e) {
    infer = undefined;
    self.postMessage({ error: String(e) });
  } finally {
    busy = false;
  }
};
