import { job } from "../../src/processing/client";
import type { Raster, UpscaleMetrics } from "../../src/processing/upscale";
function baselineJob(
  message: object,
  progress: (p: number) => void,
  report: (m: UpscaleMetrics) => void,
): ReturnType<typeof job<Raster>> {
  let worker: Worker;
  let rejectJob: (e: Error) => void;
  const promise = new Promise<Raster>((resolve, reject) => {
    rejectJob = reject;
    const run = (backend = "auto") => {
      worker = new Worker(
        new URL("./upscale-baseline.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = ({ data }) => {
        if (data.retryCpu) {
          worker.terminate();
          run("wasm");
          return;
        }
        if (data.metrics) {
          report(data.metrics);
          return;
        }
        if ("progress" in data) {
          progress(data.progress);
          return;
        }
        worker.terminate();
        if (data.error) reject(new Error(data.error));
        else resolve(data.result);
      };
      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Baseline worker failed"));
      };
      worker.postMessage({ ...message, backend });
    };
    run();
  });
  return {
    promise,
    cancel: () => {
      worker?.terminate();
      rejectJob(new Error("Cancelled"));
    },
  };
}
const log = document.querySelector("#result")!;
let active: ReturnType<typeof job<Raster>> | undefined;
let cancelled = false;
document.querySelector("#cancel")!.addEventListener("click", () => {
  cancelled = true;
  active?.cancel();
});
document
  .querySelector<HTMLButtonElement>("#run")!
  .addEventListener("click", async function () {
    this.disabled = true;
    cancelled = false;
    try {
      const file =
        document.querySelector<HTMLInputElement>("#file")!.files?.[0];
      const image = await createImageBitmap(
        file ?? (await (await fetch("/tests/fixtures/astronaut.png")).blob()),
      );
      const width = file ? image.width : 1200,
        height = file ? image.height : 800;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0, width, height);
      image.close();
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const reports: unknown[] = [];
      let previous: Uint8ClampedArray | undefined;
      for (let run = 0; run < 2; run++) {
        if (cancelled) break;
        const start = performance.now();
        let metrics: UpscaleMetrics | undefined;
        const variant =
          document.querySelector<HTMLSelectElement>("#variant")!.value;
        active = (variant === "before" ? baselineJob : job<Raster>)(
          { kind: "enhance", mode: "ai", pixels, width, height },
          (p) => {
            log.textContent =
              JSON.stringify(reports, null, 2) +
              `\nRun ${run + 1}: ${(p * 100).toFixed(0)}% / ${((performance.now() - start) / 1000).toFixed(1)}s / ${metrics?.backend ?? "selecting backend"}`;
          },
          (m) => {
            metrics = m;
          },
        );
        const out = await active.promise;
        let maxDifference = 0;
        if (previous)
          for (let i = 0; i < out.pixels.length; i++)
            maxDifference = Math.max(
              maxDifference,
              Math.abs(out.pixels[i] - previous[i]),
            );
        reports.push({
          run:
            run === 0
              ? "cold session (download cache unchanged)"
              : "warm session",
          width,
          height,
          wallMs: performance.now() - start,
          metrics,
          maxDifferenceFromPrevious: previous ? maxDifference : null,
        });
        previous = out.pixels;
        log.textContent = JSON.stringify(reports, null, 2);
      }
    } catch (e) {
      log.textContent += "\n" + String(e);
    } finally {
      this.disabled = false;
      active = undefined;
    }
  });
