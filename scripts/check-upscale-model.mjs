// Opt-in model download and native CPU smoke test, not a browser/GPU test.
import { pipeline, RawImage, env } from "@huggingface/transformers";
env.allowLocalModels = false;
const model = await pipeline("image-to-image", "Xenova/swin2SR-lightweight-x2-64", { device: "cpu", dtype: "fp32" });
const photo = await RawImage.read("tests/fixtures/astronaut.png");
const sample = await photo.resize(128,128);
try {
  const out = await model(sample);
  if (out.width !== 256 || out.height !== 256 || out.channels !== 3) throw new Error("Incorrect 2x output");
  await out.save("upscale-model-check.png");
  console.log(JSON.stringify({ actualModel: true, width: out.width, height: out.height, channels: out.channels }));
} finally { await model.dispose(); }
