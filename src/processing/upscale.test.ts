import { describe, expect, it } from "vitest";
import { fastUpscale, tiledUpscale, upscaleDimensions, tiles } from "./upscale";
import { useEditor } from "../store";

describe("2x enhancement", () => {
  it("preserves solid colors and doubles dimensions without mutating input", () => {
    const input = {
      width: 1,
      height: 1,
      pixels: new Uint8ClampedArray([80, 100, 120, 128]),
    };
    const out = fastUpscale(input);
    expect(out.width).toBe(2);
    expect(out.height).toBe(2);
    expect(Array.from(out.pixels)).toEqual(
      Array(4).fill([80, 100, 120, 128]).flat(),
    );
    expect(input.pixels).toEqual(new Uint8ClampedArray([80, 100, 120, 128]));
  });
  it("does not leak invisible RGB into transparent edges", () => {
    const out = fastUpscale({
      width: 2,
      height: 1,
      pixels: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 0]),
    });
    expect(out.pixels[4]).toBe(255);
    expect(out.pixels[6]).toBe(0);
    expect(out.pixels[7]).toBe(203);
  });
  it("limits output allocations before model loading", () => {
    expect(upscaleDimensions(4000, 2000)).toEqual({
      width: 8000,
      height: 4000,
    });
    expect(() => upscaleDimensions(4000, 3000)).toThrow("32 megapixels");
    expect(() => upscaleDimensions(0, 5)).toThrow();
  });
  it("covers odd image sizes with nonoverlapping cores and bounded halos", () => {
    const coverage = new Uint8Array(259 * 131);
    for (const t of tiles(259, 131)) {
      expect(t.right - t.left).toBeLessThanOrEqual(192);
      expect(t.bottom - t.top).toBeLessThanOrEqual(192);
      for (let y = t.y; y < t.y + t.height; y++)
        for (let x = t.x; x < t.x + t.width; x++) coverage[y * 259 + x]++;
    }
    expect(coverage.every((v) => v === 1)).toBe(true);
  });
  it("stitches actual inference outputs at the correct halo offsets", async () => {
    const width = 259,
      height = 131,
      pixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++)
      pixels.set([i % 251, Math.floor(i / width), 20, 255], i * 4);
    let calls = 0,
      progress = 0;
    // Controlled test double verifies stitching only; it is not an AI accuracy test.
    const out = await tiledUpscale(
      { width, height, pixels },
      async (rgb, w, h) => {
        calls++;
        const data = new Uint8Array(w * 2 * h * 2 * 3);
        for (let y = 0; y < h * 2; y++)
          for (let x = 0; x < w * 2; x++)
            data.set(
              rgb.subarray(
                (Math.floor(y / 2) * w + Math.floor(x / 2)) * 3,
                (Math.floor(y / 2) * w + Math.floor(x / 2)) * 3 + 3,
              ),
              (y * w * 2 + x) * 3,
            );
        return { data, width: w * 2, height: h * 2, channels: 3 };
      },
      (v) => {
        expect(v).toBeGreaterThan(progress);
        progress = v;
      },
    );
    expect(calls).toBe(6);
    expect(progress).toBe(1);
    for (let y = 0; y < height * 2; y++)
      for (let x = 0; x < width * 2; x++)
        expect(out.pixels[(y * width * 2 + x) * 4]).toBe(
          pixels[(Math.floor(y / 2) * width + Math.floor(x / 2)) * 4],
        );
  });
  it("rejects wrong-scale model outputs instead of silently resizing them", async () => {
    await expect(
      tiledUpscale(
        { width: 1, height: 1, pixels: new Uint8ClampedArray([0, 0, 0, 255]) },
        async () => ({
          data: new Uint8Array(3),
          width: 1,
          height: 1,
          channels: 3,
        }),
      ),
    ).rejects.toThrow("unexpected 2x");
  });
  it("preserves enhancement through undo/redo and resets on a new photo", () => {
    const s = useEditor.getState();
    s.newImage();
    s.commit({ upscale: "ai" }, "Enhance");
    s.undo();
    expect(useEditor.getState().upscale).toBe("none");
    s.redo();
    expect(useEditor.getState().upscale).toBe("ai");
    s.newImage();
    expect(useEditor.getState().upscale).toBe("none");
  });
});

it("rejects transparent AI input before inference", async () => {
  let called = false;
  await expect(
    tiledUpscale(
      { width: 1, height: 1, pixels: new Uint8ClampedArray([255, 0, 0, 128]) },
      async () => {
        called = true;
        throw new Error("unexpected");
      },
    ),
  ).rejects.toThrow("opaque photograph");
  expect(called).toBe(false);
});
it("retains applied output on undo and invalidates it on edits", () => {
  const s = useEditor.getState();
  s.newImage();
  const enhanced = {
    blob: new Blob(["result"]),
    before: new Blob(["original"]),
    width: 4,
    height: 4,
  };
  s.commit({ enhanced, upscale: "fast" }, "Apply");
  s.set("exposure", 1);
  expect(useEditor.getState().enhanced).toBeUndefined();
  expect(useEditor.getState().upscale).toBe("none");
  s.undo();
  expect(useEditor.getState().enhanced).toBe(enhanced);
  s.redo();
  expect(useEditor.getState().enhanced).toBeUndefined();
  s.newImage();
  expect(useEditor.getState().enhanced).toBeUndefined();
});
