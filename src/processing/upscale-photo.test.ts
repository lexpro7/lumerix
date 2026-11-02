import { it, expect } from "vitest";
import sharp from "sharp";
import { fastUpscale } from "./upscale";
it("upscales real photograph pixels and encodes PNG/JPEG at exactly 2x", async () => {
  const { data, info } = await sharp("tests/fixtures/astronaut.png")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = fastUpscale({
    pixels: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  });
  expect([out.width, out.height]).toEqual([1024, 1024]);
  const image = sharp(out.pixels, {
    raw: { width: out.width, height: out.height, channels: 4 },
  });
  for (const format of ["png", "jpeg"] as const) {
    const encoded = await image.clone()[format]().toBuffer();
    const metadata = await sharp(encoded).metadata();
    expect([metadata.width, metadata.height]).toEqual([1024, 1024]);
  }
  const png = await image.png().toBuffer();
  const decoded = await sharp(png).ensureAlpha().raw().toBuffer();
  expect(Buffer.compare(decoded, Buffer.from(out.pixels))).toBe(0);
});
