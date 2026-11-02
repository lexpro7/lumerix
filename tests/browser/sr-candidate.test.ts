import { describe, it, expect } from "vitest";
import { packRgb, reduceOutput } from "./sr-candidate";
describe("benchmark-only Real-ESRGAN adapter", () => {
  it("packs RGB bytes as normalized NCHW without swapping channels", () => {
    expect(
      Array.from(
        packRgb(new Uint8ClampedArray([255, 0, 128, 0, 255, 64]), 2, 1),
      ),
    ).toEqual([1, 0, 0, 1, Math.fround(128 / 255), Math.fround(64 / 255)]);
  });
  it("reduces a native 4x tensor to exactly 2x, preserving channel and spatial layout", () => {
    const data = new Float32Array(48);
    data.fill(1, 0, 16);
    data.fill(0.5, 16, 32);
    data.fill(0, 32);
    const out = reduceOutput(data, [1, 3, 4, 4], 1, 1);
    expect([out.width, out.height]).toEqual([2, 2]);
    expect(Array.from(out.data)).toEqual(Array(4).fill([255, 128, 0]).flat());
  });
  it("averages each 2x2 group without crossing channel or row boundaries", () => {
    const data = new Float32Array(48);
    data[0] = 1;
    data[1] = 1;
    data[4] = 1;
    data[5] = 1;
    const out = reduceOutput(data, [1, 3, 4, 4], 1, 1);
    expect(Array.from(out.data)).toEqual([
      255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });
  it("rejects wrong shape and non-finite model results", () => {
    expect(() =>
      reduceOutput(new Float32Array(48), [1, 4, 4, 3], 1, 1),
    ).toThrow("dimensions");
    const data = new Float32Array(48);
    data[0] = NaN;
    expect(() => reduceOutput(data, [1, 3, 4, 4], 1, 1)).toThrow("Non-finite");
  });
});
