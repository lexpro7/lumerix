// Native CPU diagnostic only; browser WebGPU must be measured separately.
import { pipeline, RawImage, env } from "@huggingface/transformers";
const variant = process.argv[2] ?? "after";
if (!["before", "after"].includes(variant))
  throw new Error("Use before or after");
const { tiledUpscale } = await import(
  variant === "before"
    ? "./upscale-baseline.ts"
    : "../src/processing/upscale.ts"
);
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
const start = performance.now();
env.allowLocalModels = false;
const model = await pipeline(
  "image-to-image",
  "Xenova/swin2SR-lightweight-x2-64",
  { device: "cpu", dtype: "fp32" },
);
const loadMs = performance.now() - start;
const original = await RawImage.read(
  process.argv[3] ?? "tests/fixtures/astronaut.png",
);
const image = process.argv[3] ? original : await original.resize(1200, 800);
console.log(
  JSON.stringify({
    source: process.argv[3] ? "user photograph" : "bundled fixture",
    width: image.width,
    height: image.height,
  }),
);
const rgba = new Uint8ClampedArray(image.width * image.height * 4);
for (let i = 0; i < image.width * image.height; i++) {
  rgba.set(
    image.data.subarray(i * image.channels, i * image.channels + 3),
    i * 4,
  );
  rgba[i * 4 + 3] = 255;
}
const reports = [];
for (let run = 0; run < 2; run++) {
  let inferenceMs = 0,
    calls = 0;
  const begin = performance.now();
  const out = await tiledUpscale(
    { pixels: rgba, width: image.width, height: image.height },
    async (rgb, w, h) => {
      const t = performance.now();
      const result = await model(new RawImage(rgb, w, h, 3));
      inferenceMs += performance.now() - t;
      calls++;
      return result;
    },
  );
  const report = {
    run: run === 0 ? "session-cold" : "warm",
    loadMs: run === 0 ? loadMs : 0,
    totalMs: performance.now() - begin,
    inferenceMs,
    calls,
    width: image.width,
    height: image.height,
    backend: "native CPU",
    downloadCache: "existing disk cache",
    outputSHA256: createHash("sha256").update(out.pixels).digest("hex"),
  };
  reports.push(report);
  console.log(JSON.stringify(report));
}
await writeFile(
  `scripts/benchmark-${process.argv[3] ? "user-" : ""}${variant}.json`,
  JSON.stringify(reports, null, 2),
);
await model.dispose();
