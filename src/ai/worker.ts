/// <reference lib="webworker" />
import {
  pipeline,
  RawImage,
  env,
  type ImageSegmentationPipeline,
} from "@huggingface/transformers";
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.numThreads = 1;
const createSegmenter = pipeline as unknown as (
  task: "image-segmentation",
  model: string,
  options: object,
) => Promise<ImageSegmentationPipeline>;
let model: Promise<ImageSegmentationPipeline> | null = null;
let backend: "webgpu" | "wasm" = "wasm";
let cachedId = "",
  cachedResult: Segment[] = [];
interface Segment {
  label: string;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
self.onmessage = async ({ data: m }) => {
  try {
    if (cachedId === m.imageId) {
      self.postMessage({ result: cachedResult });
      return;
    }
    if (!model) {
      const load = async () => {
        const options = {
          dtype: "fp32" as const,
          progress_callback: (p: { status: string; progress?: number }) =>
            self.postMessage({ progress: p.progress ?? 0, status: p.status }),
        };
        try {
          if ("gpu" in navigator) {
            backend = "webgpu";
            return (await createSegmenter(
              "image-segmentation",
              "Xenova/segformer-b0-finetuned-ade-512-512",
              { ...options, device: "webgpu" },
            )) as ImageSegmentationPipeline;
          }
        } catch {
          self.postMessage({ status: "WebGPU unavailable. Switching to CPU." });
        }
        backend = "wasm";
        return (await createSegmenter(
          "image-segmentation",
          "Xenova/segformer-b0-finetuned-ade-512-512",
          { ...options, device: "wasm" },
        )) as ImageSegmentationPipeline;
      };
      model = load().catch((e) => {
        model = null;
        throw e;
      });
    }
    const segmenter = await model;
    self.postMessage({ status: "Selecting regions on your device…" });
    const original = new RawImage(m.pixels, m.width, m.height, 4);
    // Semantic postprocessing resizes every class's logits to input size.
    // Bound that allocation; masks are resampled in source coordinates later.
    const scale = Math.min(1, 512 / Math.max(m.width, m.height));
    const image =
      scale < 1
        ? await original.resize(
            Math.max(1, Math.round(m.width * scale)),
            Math.max(1, Math.round(m.height * scale)),
          )
        : original;
    let output;
    try {
      output = await segmenter(image);
    } catch (error) {
      if (backend !== "webgpu") throw error;
      await segmenter.dispose();
      backend = "wasm";
      self.postMessage({
        status: "GPU inference unavailable. Retrying on CPU…",
      });
      model = createSegmenter(
        "image-segmentation",
        "Xenova/segformer-b0-finetuned-ade-512-512",
        { device: "wasm", dtype: "fp32" },
      );
      output = await (await model)(image);
    }
    const segments = output as { label: string; mask: RawImage }[];
    cachedResult = segments.map((s) => ({
      label: s.label,
      width: s.mask.width,
      height: s.mask.height,
      data: new Uint8ClampedArray(s.mask.data),
    }));
    cachedId = m.imageId;
    self.postMessage({ result: cachedResult });
  } catch (e) {
    self.postMessage({
      error:
        e instanceof Error
          ? e.message
          : "Segmentation failed. Try a manual brush mask.",
    });
  }
};
