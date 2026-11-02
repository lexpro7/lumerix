import { job } from "../../src/processing/client";
import { fastUpscale, type Raster } from "../../src/processing/upscale";
const log = document.querySelector("#result")!;
document.querySelector("#run")!.addEventListener("click", async () => {
  log.textContent = "Loading public photographic fixture...";
  const start = performance.now();
  let beats = 0;
  const timer = setInterval(() => beats++, 100);
  try {
    const response = await fetch("/tests/fixtures/astronaut.png");
    if (!response.ok) throw new Error("Missing fixture");
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(48, 48),
      ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 180, 80, 96, 96, 0, 0, 48, 48);
    bitmap.close();
    const pixels = ctx.getImageData(0, 0, 48, 48).data,
      input = { pixels, width: 48, height: 48 };
    const out = await job<Raster>(
      { kind: "enhance", mode: "ai", ...input },
      (p) => {
        log.textContent = `Actual model processing ${Math.round(p * 100)}%`;
      },
    ).promise;
    if (out.width !== 96 || out.height !== 96)
      throw new Error("Wrong 2x output dimensions");
    const fast = fastUpscale(input);
    let difference = 0;
    for (let i = 0; i < out.pixels.length; i++)
      if (i % 4 !== 3) difference += Math.abs(out.pixels[i] - fast.pixels[i]);
    difference /= 96 * 96 * 3;
    if (difference < 0.01)
      throw new Error("Model output indistinguishable from fast interpolation");
    const c = document.querySelector<HTMLCanvasElement>("#preview")!;
    c.width = 96;
    c.height = 96;
    c.style.width = "384px";
    c.getContext("2d")!.putImageData(
      new ImageData(new Uint8ClampedArray(out.pixels), 96, 96),
      0,
      0,
    );
    log.textContent = `PASS: actual neural model returned 96x96 output. Mean RGB difference from Fast Upscale: ${difference.toFixed(3)}/255. Elapsed ${((performance.now() - start) / 1000).toFixed(1)}s; UI heartbeats ${beats}. This is a runtime smoke test, not a perceptual quality benchmark.`;
  } catch (e) {
    log.textContent = "FAIL: " + String(e);
  } finally {
    clearInterval(timer);
  }
});
