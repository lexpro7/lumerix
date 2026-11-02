import type { UpscaleMetrics } from "./upscale";
let idle:
  | { worker: Worker; backend: string; timer: ReturnType<typeof setTimeout> }
  | undefined;
const reusable = (m: object) => {
  const v = m as {
    kind?: string;
    mode?: string;
    document?: { upscale?: string };
  };
  return (
    (v.kind === "apply-enhance" && v.document?.upscale === "ai") ||
    (v.kind === "enhance" && v.mode === "ai")
  );
};
function retain(worker: Worker, backend: string) {
  if (idle) {
    clearTimeout(idle.timer);
    idle.worker.terminate();
  }
  worker.onmessage = null;
  worker.onerror = null;
  idle = {
    worker,
    backend,
    timer: setTimeout(() => {
      if (idle?.worker === worker) {
        worker.terminate();
        idle = undefined;
      }
    }, 60000),
  };
}
export function job<T>(
  message: object,
  onProgress?: (v: number) => void,
  onMetrics?: (metrics: UpscaleMetrics) => void,
): { promise: Promise<T>; cancel: () => void } {
  let worker: Worker;
  let rejectJob: (e: Error) => void;
  let fallback: ReturnType<typeof job<T>> | undefined;
  let cancelled = false,
    settled = false;
  const keep = reusable(message),
    backend = (message as { backend?: string }).backend ?? "auto";
  const promise = new Promise<T>((resolve, reject) => {
    rejectJob = reject;
    try {
      if (keep && idle?.backend === backend) {
        worker = idle.worker;
        clearTimeout(idle.timer);
        idle = undefined;
      } else
        worker = new Worker(new URL("./worker.ts", import.meta.url), {
          type: "module",
        });
    } catch {
      reject(
        new Error(
          "This browser could not start the image worker. Try a current browser with Web Worker support.",
        ),
      );
      return;
    }
    worker.onmessage = ({ data }) => {
      if (cancelled) return;
      if (data.retryCpu) {
        worker.terminate();
        fallback = job<T>(
          { ...message, backend: "wasm" },
          onProgress,
          onMetrics,
        );
        fallback.promise.then(resolve, reject);
        return;
      }
      if (data.metrics) {
        onMetrics?.(data.metrics);
        return;
      }
      if ("progress" in data) {
        onProgress?.(data.progress);
        return;
      }
      settled = true;
      if (keep && !data.error) retain(worker, backend);
      else worker.terminate();
      if (data.error) reject(new Error(data.error));
      else resolve(data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(
        new Error(
          "Processing failed. Try a smaller image or a browser with Web Worker support.",
        ),
      );
    };
    try {
      worker.postMessage(message);
    } catch (error) {
      worker.terminate();
      reject(error);
    }
  });
  return {
    promise,
    cancel: () => {
      if (settled) return;
      cancelled = true;
      worker?.terminate();
      fallback?.cancel();
      rejectJob(new Error("Cancelled"));
    },
  };
}
