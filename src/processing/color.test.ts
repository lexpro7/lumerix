import { describe, expect, it } from "vitest";
import { rgbToLab, labToRgb, type Triple } from "./color";
import { analyze } from "./analysis";
import { defaults } from "./adjustments";
import { processPixels, transferLab } from "./transfer";
describe("D65 sRGB / Lab", () => {
  it("matches known white, black and red coordinates", () => {
    expect(rgbToLab(0, 0, 0)).toEqual([0, 0, 0]);
    const white = rgbToLab(255, 255, 255);
    expect(white[0]).toBeCloseTo(100, 3);
    expect(white[1]).toBeCloseTo(0, 3);
    expect(white[2]).toBeCloseTo(0, 3);
    const red = rgbToLab(255, 0, 0);
    expect(red[0]).toBeCloseTo(53.2408, 3);
    expect(red[1]).toBeCloseTo(80.0925, 3);
    expect(red[2]).toBeCloseTo(67.2032, 3);
  });
  it("round-trips colors including gamut boundaries", () => {
    for (const rgb of [
      [0, 0, 0],
      [255, 255, 255],
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [128, 91, 201],
      [4, 10, 20],
    ] as Triple[]) {
      const result = labToRgb(...rgbToLab(...rgb));
      rgb.forEach((v, c) =>
        expect(Math.abs(result[c] - v)).toBeLessThan(0.001),
      );
    }
  });
});
const pixels = new Uint8ClampedArray([
  12, 32, 80, 255, 170, 100, 55, 255, 250, 235, 200, 128,
]);
describe("transfer and adjustments", () => {
  it("preserves exact original pixels at zero strength", () => {
    const stats = analyze(pixels);
    expect(
      processPixels(pixels, stats, stats, { ...defaults, strength: 0 }),
    ).toEqual(pixels);
  });
  it("does not mutate source pixels and preserves alpha", () => {
    const original = pixels.slice();
    const stats = analyze(pixels);
    const out = processPixels(pixels, stats, null, {
      ...defaults,
      exposure: 1,
    });
    expect(pixels).toEqual(original);
    expect(out[0]).toBeGreaterThan(pixels[0]);
    expect(out[11]).toBe(128);
  });
  it("maps source mean to reference mean and scales deviations", () => {
    const s = {
      ...analyze(pixels),
      mean: [50, 10, 20] as Triple,
      std: [10, 5, 2] as Triple,
    };
    const r = {
      ...s,
      mean: [60, 0, -10] as Triple,
      std: [20, 10, 4] as Triple,
    };
    expect(transferLab(s.mean, s, r)).toEqual(r.mean);
    expect(transferLab([60, 15, 22], s, r)).toEqual([80, 10, -6]);
  });
  it("handles flat images and transparent samples without NaN", () => {
    const flat = new Uint8ClampedArray([80, 80, 80, 255, 80, 80, 80, 255]);
    const stats = analyze(flat);
    const ref = analyze(new Uint8ClampedArray([180, 100, 60, 255]));
    expect(transferLab(stats.mean, stats, ref).every(Number.isFinite)).toBe(
      true,
    );
    expect(
      Array.from(processPixels(flat, stats, ref, defaults)).every(
        Number.isFinite,
      ),
    ).toBe(true);
    expect(analyze(new Uint8ClampedArray(16)).std).toEqual([0, 0, 0]);
  });
  it("applies each independent adjustment without a reference", () => {
    const stats = analyze(pixels);
    for (const key of [
      "exposure",
      "contrast",
      "saturation",
      "warmth",
      "shadows",
      "highlights",
    ] as const) {
      const p = { ...defaults, [key]: key === "exposure" ? 1 : 40 };
      expect(processPixels(pixels, stats, null, p)).not.toEqual(pixels);
    }
  });
  it("blends halfway between original and full transfer", () => {
    const stats = analyze(pixels),
      ref = analyze(
        new Uint8ClampedArray([130, 170, 200, 255, 40, 90, 130, 255]),
      );
    const full = processPixels(pixels, stats, ref, {
        ...defaults,
        strength: 100,
      }),
      half = processPixels(pixels, stats, ref, { ...defaults, strength: 50 });
    for (let i = 0; i < pixels.length; i++)
      if (i % 4 !== 3)
        expect(
          Math.abs(half[i] - (pixels[i] + full[i]) / 2),
        ).toBeLessThanOrEqual(1);
  });
});
