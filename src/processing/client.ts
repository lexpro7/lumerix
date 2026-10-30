export function job<T>(message: object, onProgress?: (v: number) => void) {
  let worker: Worker;
  let rejectJob: (e: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    rejectJob = reject;
    try {
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
      if ("progress" in data) {
        onProgress?.(data.progress);
        return;
      }
      worker.terminate();
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
      worker?.terminate();
      rejectJob(new Error("Cancelled"));
    },
  };
}
