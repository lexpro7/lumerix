import type { Raster, UpscaleMetrics } from "../../src/processing/upscale";
const q = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const run = q<HTMLButtonElement>("run"),
  cancel = q<HTMLButtonElement>("cancel"),
  save = q<HTMLButtonElement>("save");
let workers: Worker[] = [],
  rejectActive: ((reason: Error) => void) | undefined;
let reports: object[] = [],
  urls: string[] = [],
  stopped = false;
const dispose = () => {
  workers.forEach((w) => w.terminate());
  workers = [];
  rejectActive?.(new Error("Cancelled"));
  rejectActive = undefined;
};
window.addEventListener("pagehide", () => {
  dispose();
  urls.forEach(URL.revokeObjectURL);
});
cancel.onclick = () => {
  stopped = true;
  dispose();
};
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
save.onclick = () =>
  download(
    new Blob([JSON.stringify(reports, null, 2)], { type: "application/json" }),
    "lightdna-model-benchmark.json",
  );
run.onclick = async () => {
  const file = q<HTMLInputElement>("file").files?.[0];
  if (!file) {
    q("status").textContent = "Choose a photograph first.";
    return;
  }
  run.disabled = true;
  cancel.disabled = false;
  save.disabled = true;
  q<HTMLInputElement>("file").disabled = true;
  q<HTMLSelectElement>("backend").disabled = true;
  q<HTMLInputElement>("accuracy").disabled = true;
  reports = [];
  stopped = false;
  urls.forEach(URL.revokeObjectURL);
  urls = [];
  q("images").replaceChildren();
  q("results").textContent = "";
  try {
    const bitmap = await createImageBitmap(file);
    const controlled = q<HTMLInputElement>("accuracy").checked;
    const width = controlled ? Math.floor(bitmap.width / 2) : bitmap.width,
      height = controlled ? Math.floor(bitmap.height / 2) : bitmap.height;
    const source = new OffscreenCanvas(width, height),
      ctx = source.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const input: Raster = {
      pixels: ctx.getImageData(0, 0, width, height).data,
      width,
      height,
    };
    let truth: Uint8ClampedArray | undefined;
    if (controlled) {
      const ref = new OffscreenCanvas(width * 2, height * 2);
      const c = ref.getContext("2d")!;
      c.drawImage(
        bitmap,
        0,
        0,
        width * 2,
        height * 2,
        0,
        0,
        width * 2,
        height * 2,
      );
      truth = c.getImageData(0, 0, width * 2, height * 2).data;
    }
    bitmap.close();
    const sourceHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new Uint8Array(input.pixels)),
      ),
      (v) => v.toString(16).padStart(2, "0"),
    ).join("");
    const backend = q<HTMLSelectElement>("backend").value;
    for (const model of ["swin", "general-v3"]) {
      if (stopped) break;
      const worker = new Worker(
        new URL("./sr-compare.worker.ts", import.meta.url),
        { type: "module" },
      );
      workers.push(worker);
      let previous: Uint8ClampedArray | undefined;
      for (let pass = 0; pass < 2; pass++) {
        if (stopped) break;
        const start = performance.now();
        const response = await new Promise<{
          result: Raster;
          metrics: UpscaleMetrics;
          wallMs: number;
        }>((resolve, reject) => {
          rejectActive = reject;
          worker.onerror = () => reject(new Error("Benchmark worker failed"));
          worker.onmessage = ({ data }) => {
            if (data.error) {
              reject(new Error(data.error));
              return;
            }
            if (data.status) {
              q("status").textContent = data.status;
              return;
            }
            if ("progress" in data) {
              q("status").textContent =
                `${model} / ${backend} / ${pass ? "warm" : "cold"}: ${Math.round(data.progress * 100)}%, ${data.metrics.tiles} tiles, model pipeline ${(data.metrics.inferenceMs / 1000).toFixed(2)}s`;
              return;
            }
            resolve(data);
          };
          worker.postMessage({ input, model, backend });
        });
        rejectActive = undefined;
        const out = response.result;
        if (out.width !== width * 2 || out.height !== height * 2)
          throw new Error("Incorrect 2x output dimensions");
        let maxDifference = 0,
          squared = 0;
        for (let i = 0; i < out.pixels.length; i++) {
          if (previous)
            maxDifference = Math.max(
              maxDifference,
              Math.abs(out.pixels[i] - previous[i]),
            );
          if (truth && i % 4 !== 3) squared += (out.pixels[i] - truth[i]) ** 2;
        }
        reports.push({
          model,
          pass: pass ? "warm" : "session-cold (download cache unchanged)",
          input: [width, height],
          output: [out.width, out.height],
          sourceHash,
          wallMs: performance.now() - start,
          workerMs: response.wallMs,
          ...response.metrics,
          modelTimeDefinition:
            "processor + inference + transfers/readback + output conversion",
          maxDifferenceFromCold: previous ? maxDifference : null,
          controlledPSNR: truth
            ? squared
              ? 10 *
                Math.log10(255 ** 2 / (squared / (out.width * out.height * 3)))
              : "Infinity"
            : null,
        });
        previous = out.pixels;
        q("results").textContent = JSON.stringify(reports, null, 2);
        if (pass === 1) {
          const full = new OffscreenCanvas(out.width, out.height);
          full
            .getContext("2d")!
            .putImageData(
              new ImageData(
                new Uint8ClampedArray(out.pixels),
                out.width,
                out.height,
              ),
              0,
              0,
            );
          const box = document.createElement("div"),
            title = document.createElement("h2");
          title.textContent =
            model === "swin" ? "Swin2SR" : "Real-ESRGAN General v3 (4x to 2x)";
          box.append(title);
          const crop = document.createElement("canvas");
          crop.width = Math.min(256, out.width);
          crop.height = Math.min(256, out.height);
          crop
            .getContext("2d")!
            .drawImage(
              full,
              Math.floor((out.width - crop.width) / 2),
              Math.floor((out.height - crop.height) / 2),
              crop.width,
              crop.height,
              0,
              0,
              crop.width,
              crop.height,
            );
          box.append(crop);
          const link = document.createElement("a");
          const url = URL.createObjectURL(
            await full.convertToBlob({ type: "image/png" }),
          );
          urls.push(url);
          link.href = url;
          link.download = `${model}-2x.png`;
          link.textContent = "Download full 2x PNG";
          box.append(document.createElement("br"), link);
          q("images").append(box);
          full.width = full.height = 1;
        }
      }
      worker.terminate();
      workers = workers.filter((w) => w !== worker);
    }
    q("status").textContent = stopped
      ? "Cancelled."
      : "Finished. Compare quality before choosing a model; no editor model was changed.";
  } catch (e) {
    q("status").textContent = String(e);
  } finally {
    dispose();
    run.disabled = false;
    cancel.disabled = true;
    save.disabled = reports.length === 0;
    q<HTMLInputElement>("file").disabled = false;
    q<HTMLSelectElement>("backend").disabled = false;
    q<HTMLInputElement>("accuracy").disabled = false;
  }
};
