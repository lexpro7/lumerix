// Controlled native CPU diagnostic, not a WebGPU benchmark.
import { pipeline, RawImage, env } from "@huggingface/transformers";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  candidateUrl,
  candidateHash,
  packRgb,
  reduceOutput,
} from "../tests/browser/sr-candidate.ts";
import { tiledUpscale } from "../src/processing/upscale.ts";
const path = process.argv[2];
if (!path) throw new Error("Pass a local photograph path");
const meta = await sharp(path).metadata();
const crop = await sharp(path)
  .extract({
    left: Math.floor((meta.width - 256) / 2),
    top: Math.floor((meta.height - 256) / 2),
    width: 256,
    height: 256,
  })
  .removeAlpha()
  .raw()
  .toBuffer();
const small = await sharp(crop, {
  raw: { width: 256, height: 256, channels: 3 },
})
  .resize(128, 128, { kernel: "cubic" })
  .raw()
  .toBuffer();
const rgba = new Uint8ClampedArray(128 * 128 * 4);
for (let i = 0; i < 128 * 128; i++) {
  rgba.set(small.subarray(i * 3, i * 3 + 3), i * 4);
  rgba[i * 4 + 3] = 255;
}
const dir = "node_modules/.cache/lightdna-benchmark";
await mkdir(dir, { recursive: true });
const cache = dir + "/general-v3.onnx";
let bytes;
try {
  bytes = await readFile(cache);
} catch {
  const r = await fetch(candidateUrl);
  if (!r.ok) throw new Error(`Model download ${r.status}`);
  bytes = Buffer.from(await r.arrayBuffer());
}
if (createHash("sha256").update(bytes).digest("hex") !== candidateHash)
  throw new Error("Model checksum mismatch");
await writeFile(cache, bytes);
env.allowLocalModels = false;
const reports = [];
const visuals=[await sharp(crop,{raw:{width:256,height:256,channels:3}}).png().toBuffer()];
for (const name of ["swin", "general-v3"]) {
  const loadStart = performance.now();
  let infer, dispose;
  if (name === "swin") {
    const model = await pipeline(
      "image-to-image",
      "Xenova/swin2SR-lightweight-x2-64",
      { device: "cpu", dtype: "fp32" },
    );
    infer = async (rgb, w, h) => model(new RawImage(rgb, w, h, 3));
    dispose = () => model.dispose();
  } else {
    const session = await ort.InferenceSession.create(bytes, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
    });
    infer = async (rgb, w, h) => {
      const input = new ort.Tensor("float32", packRgb(rgb, w, h), [1, 3, h, w]);
      const outputs = await session.run({ [session.inputNames[0]]: input });
      const out = outputs[session.outputNames[0]];
      return reduceOutput(out.data, out.dims, w, h);
    };
    dispose = () => session.release();
  }
  const loadMs = performance.now() - loadStart;
  for (let run = 0; run < 2; run++) {
    const metrics = {
      backend: "native CPU",
      warm: run === 1,
      loadMs: run === 0 ? loadMs : 0,
      packMs: 0,
      inferenceMs: 0,
      stitchMs: 0,
      tiles: 0,
    };
    const start = performance.now();
    const out = await tiledUpscale(
      { pixels: rgba, width: 128, height: 128 },
      infer,
      () => {},
      metrics,
    );
    let mse = 0,
      edge = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++)
        for (let c = 0; c < 3; c++) {
          const i = (y * 256 + x) * 4 + c;
          mse += (out.pixels[i] - crop[(y * 256 + x) * 3 + c]) ** 2;
          if (x) edge += Math.abs(out.pixels[i] - out.pixels[i - 4]);
        }
    const report = {
      name,
      run,
      wallMs: performance.now() - start,
      metrics,
      controlledPSNR: 10 * Math.log10(255 ** 2 / (mse / (256 * 256 * 3))),
      meanHorizontalGradient: edge / (256 * 255 * 3),
      outputSHA256: createHash("sha256").update(out.pixels).digest("hex"),
    };
    if(run===1 && process.argv.includes("--preview")) visuals.push(await sharp(out.pixels,{raw:{width:256,height:256,channels:4}}).png().toBuffer());
    reports.push(report);
    console.log(JSON.stringify(report));
  }
  await dispose();
}
await writeFile(
  "scripts/sr-comparison-native.json",
  JSON.stringify(
    {
      protocol:
        "center 256x256 crop, bicubic reduction to 128x128, reconstructed 256x256; not full photograph / not GPU",
      reports,
    },
    null,
    2,
  ),
);

if(process.argv.includes("--preview")) await sharp({create:{width:768,height:256,channels:3,background:"white"}}).composite(visuals.map((input,i)=>({input,left:i*256,top:0}))).png().toFile(dir+"/quality.png");
