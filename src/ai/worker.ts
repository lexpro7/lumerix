/// <reference lib="webworker" />
import {
  pipeline,
  RawImage,
  env,
  type ImageSegmentationPipeline,
} from "@huggingface/transformers";
import { ModelCache } from "./model-cache";
import type { Backend, Segment } from "./client";
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.numThreads = 1;
const createSegmenter = pipeline as unknown as (
  task: "image-segmentation",
  model: string,
  options: object,
) => Promise<ImageSegmentationPipeline>;
const cache = new ModelCache<ImageSegmentationPipeline>();
let backend: "wasm" | "webgpu" = "wasm",
  requested: Backend | null = null;
let cachedId = "",
  cachedResult: Segment[] = [],
  busy = false;
self.onmessage = async ({ data: m }) => {
  const send = (payload: object) => self.postMessage({ id: m.id, ...payload });
  if (busy) {
    send({ error: "Selection is already running" });
    return;
  }
  busy = true;
  try {
    if (requested !== m.backend) {
      // Client normally reuses a backend; explicit diagnostic switches dispose it.
      if (requested !== null) {
        try {
          await (
            await cache.get(() => Promise.reject(new Error("No model")))
          ).dispose();
        } catch {}
      }
      cache.clear();
      cachedId = "";
      cachedResult = [];
      requested = m.backend;
    }
    if (cachedId === m.imageId) {
      send({ result: cachedResult });
      return;
    }
    const load = (device: "wasm" | "webgpu") =>
      cache.get(async () => {
        backend = device;
        send({
          status: `Loading semantic model (${device === "wasm" ? "CPU" : "GPU"})...`,
        });
        return createSegmenter(
          "image-segmentation",
          "Xenova/segformer-b0-finetuned-ade-512-512",
          {
            device,
            dtype: "fp32",
            progress_callback: (p: { status: string; progress?: number }) => {
              if (p.status === "progress")
                send({
                  status: `Downloading semantic model... ${Math.round(p.progress ?? 0)}%`,
                });
            },
          },
        );
      });
    let segmenter: ImageSegmentationPipeline;
    try {
      segmenter = await load(
        m.backend === "webgpu" || (m.backend === "auto" && "gpu" in navigator)
          ? "webgpu"
          : "wasm",
      );
    } catch (error) {
      if (m.backend !== "auto" || backend !== "webgpu") throw error;
      send({ retryCpu: true });
      return;
    }
    const scale = Math.min(1, 512 / Math.max(m.width, m.height));
    const original = new RawImage(m.pixels, m.width, m.height, 4);
    const image =
      scale < 1
        ? await original.resize(
            Math.max(1, Math.round(m.width * scale)),
            Math.max(1, Math.round(m.height * scale)),
          )
        : original;
    m.pixels = null;
    send({
      status: `Selecting regions (${backend === "wasm" ? "CPU" : "GPU"})...`,
    });
    let output;
    try {
      output = await segmenter(image);
    } catch (error) {
      if (backend !== "webgpu" || m.backend !== "auto") throw error;
      cache.clear();
      // The client terminates this worker. Do not wait for a failed GPU
      // runtime to dispose before requesting the clean CPU worker.
      send({ retryCpu: true });
      return;
    }
    cachedResult = (output as { label: string; mask: RawImage }[]).map((s) => ({
      label: s.label,
      width: s.mask.width,
      height: s.mask.height,
      data: new Uint8ClampedArray(s.mask.data),
    }));
    cachedId = m.imageId;
    send({ result: cachedResult, backend });
  } catch (error) {
    // The client terminates this worker on error; model and intermediate tensors
    // are freed, including any partially initialized inference runtime.
    cache.clear();
    cachedId = "";
    cachedResult = [];
    send({
      error:
        error instanceof Error ? error.message : "Semantic selection failed",
    });
  } finally {
    busy = false;
  }
};
