import type { Photo } from "../processing/decode";
export interface Segment {
  label: string;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
export type Backend = "auto" | "wasm" | "webgpu";
type Kind = "semantic" | "portrait";
let worker: Worker | null = null;
let workerKind: Kind | null = null;
let sequence = 0;
let pending: {
  id: number;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
} | null = null;
/** Terminates inference as well as downloads and frees worker-owned models/buffers. */
export function disposeAI() {
  const old = pending;
  pending = null;
  if (old) {
    clearTimeout(old.timer);
    old.reject(new Error("Selection cancelled."));
  }
  worker?.terminate();
  worker = null;
  workerKind = null;
}
function run(
  kind: Kind,
  photo: Photo,
  status: (s: string) => void,
  backend: Backend,
): Promise<Segment[]> {
  if (pending || (worker && workerKind !== kind)) disposeAI();
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => {
      if (pending?.id !== id) return;
      clearTimeout(pending.timer);
      pending = null;
      worker?.terminate();
      worker = null;
      workerKind = null;
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    pending = {
      id,
      reject,
      timer: setTimeout(
        () =>
          fail(
            new Error(
              "Selection timed out. Retry, or use Brush. Model downloads require a connection on first use.",
            ),
          ),
        180000,
      ),
    };
    try {
      worker ??=
        kind === "semantic"
          ? new Worker(new URL("./worker.ts", import.meta.url), {
              type: "module",
            })
          : new Worker(`${import.meta.env.BASE_URL}ai/portrait.worker.js`);
      workerKind = kind;
      const current = worker;
      current.onmessage = ({ data }) => {
        if (worker !== current || pending?.id !== id || data.id !== id) return;
        if (data.retryCpu && backend === "auto") {
          clearTimeout(pending.timer);
          pending = null;
          current.terminate();
          worker = null; workerKind = null;
          status("GPU unavailable. Restarting inference on CPU...");
          // ONNX may retain failed provider initialization inside a worker.
          // A fresh realm is required for reliable CPU fallback.
          run(kind, photo, status, "wasm").then(resolve, reject);
          return;
        }
        if (data.error) {
          fail(new Error(`${data.error} Retry the selection or use Brush.`));
          return;
        }
        if (data.result) {
          clearTimeout(pending.timer);
          pending = null;
          resolve(data.result);
        } else status(data.status ?? "Processing on this device...");
      };
      current.onerror = () =>
        fail(
          new Error(
            "AI worker failed. Retry in a current browser with Web Worker and WebAssembly support.",
          ),
        );
      current.onmessageerror = () =>
        fail(new Error("AI returned unreadable data."));
      status("Preparing on-device selection...");
      // Copy only the bounded preview. Never transfer/detach the editor's input.
      current.postMessage({
        id,
        pixels: photo.preview.data,
        width: photo.preview.width,
        height: photo.preview.height,
        imageId: photo.url,
        backend,
      });
    } catch (error) {
      fail(error);
    }
  });
}
export const semanticSegments = (
  photo: Photo,
  status: (s: string) => void,
  backend: Backend = "auto",
) => run("semantic", photo, status, backend);
export const portraitSegments = (
  photo: Photo,
  status: (s: string) => void,
  backend: Backend = "wasm",
) => run("portrait", photo, status, backend);
