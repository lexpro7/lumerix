import type { Photo } from "../processing/decode";
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";
export interface Segment {
  label: string;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
let worker: Worker | null = null,
  busy = false;
let rejectPending: ((error: Error) => void) | null = null;
let watchdog: ReturnType<typeof setTimeout> | null = null;
function finishJob() {
  busy = false;
  rejectPending = null;
  if (watchdog) clearTimeout(watchdog);
  watchdog = null;
}
export function semanticSegments(photo: Photo, status: (s: string) => void) {
  if (busy) throw new Error("A selection is already running.");
  busy = true;
  return new Promise<Segment[]>((resolve, reject) => {
    try {
      worker ??= new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
    } catch (error) {
      finishJob();
      reject(error);
      return;
    }
    rejectPending = reject;
    watchdog = setTimeout(() => {
      const pending = rejectPending;
      worker?.terminate();
      worker = null;
      finishJob();
      pending?.(
        new Error(
          "Selection took too long on this device. Try Brush, or retry with a smaller photo.",
        ),
      );
    }, 180000);
    worker!.onmessage = ({ data }) => {
      if (data.error) {
        finishJob();
        reject(new Error(data.error));
      } else if (data.result) {
        finishJob();
        resolve(data.result);
      } else
        status(
          data.status === "progress"
            ? `Downloading model… ${Math.round(data.progress)}%`
            : (data.status ?? "Loading model…"),
        );
    };
    worker!.onerror = () => {
      finishJob();
      worker?.terminate();
      worker = null;
      reject(
        new Error(
          "AI worker could not start. Use Brush or retry in a current browser.",
        ),
      );
    };
    try {
      worker!.postMessage({
        pixels: photo.preview.data,
        width: photo.preview.width,
        height: photo.preview.height,
        imageId: photo.url,
      });
    } catch (error) {
      worker?.terminate();
      worker = null;
      finishJob();
      reject(error);
    }
  });
}
export function disposeAI() {
  rejectPending?.(new Error("Selection cancelled."));
  finishJob();
  worker?.terminate();
  worker = null;
  busy = false;
  skinModel?.then((m) => m.close()).catch(() => {});
  skinModel = null;
  skinCache = null;
}
let skinModel: Promise<ImageSegmenter> | null = null;
let skinCache: { id: string; result: Segment[] } | null = null;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";
async function modelBytes() {
  const cache = await caches.open("lightdna-ai-models-v1");
  let response = await cache.match(MODEL);
  if (!response) {
    response = await fetch(MODEL);
    if (!response.ok)
      throw new Error(
        "The skin model could not download. Connect once or use Brush.",
      );
    await cache.put(MODEL, response.clone());
  }
  return new Uint8Array(await response.arrayBuffer());
}
export async function portraitSegments(
  photo: Photo,
  status: (s: string) => void,
): Promise<Segment[]> {
  if (skinCache?.id === photo.url) return skinCache.result;
  status("Loading portrait model (cached after first use)…");
  skinModel ??= (async () => {
    const files = await FilesetResolver.forVisionTasks("/ai/mediapipe");
    return ImageSegmenter.createFromOptions(files, {
      baseOptions: { modelAssetBuffer: await modelBytes(), delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  })().catch((e) => {
    skinModel = null;
    throw e;
  });
  const segmenter = await skinModel;
  status("Finding skin and person regions…");
  const canvas = document.createElement("canvas");
  canvas.width = photo.preview.width;
  canvas.height = photo.preview.height;
  canvas.getContext("2d")!.putImageData(photo.preview, 0, 0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const result = segmenter.segment(canvas);
  try {
    const mask = result.categoryMask;
    if (!mask) throw new Error("No portrait segmentation was returned.");
    const labels = mask.getAsUint8Array(),
      skin = new Uint8ClampedArray(labels.length),
      person = new Uint8ClampedArray(labels.length);
    for (let i = 0; i < labels.length; i++) {
      skin[i] = labels[i] === 2 || labels[i] === 3 ? 255 : 0;
      person[i] = labels[i] > 0 ? 255 : 0;
    }
    const segments = [
      { label: "skin", width: mask.width, height: mask.height, data: skin },
      { label: "person", width: mask.width, height: mask.height, data: person },
    ];
    skinCache = { id: photo.url, result: segments };
    return segments;
  } finally {
    result.close();
    canvas.width = canvas.height = 1;
  }
}
