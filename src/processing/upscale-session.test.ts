import { beforeEach, expect, it, vi } from "vitest";
const factory = vi.hoisted(() => vi.fn());
vi.mock("@huggingface/transformers", () => ({
  pipeline: factory,
  RawImage: class {},
  env: { backends: { onnx: { wasm: {} } } },
}));
beforeEach(() => {
  vi.resetModules();
  factory.mockReset();
  vi.stubGlobal("navigator", {});
});
const input = {
  width: 1,
  height: 1,
  pixels: new Uint8ClampedArray([20, 30, 40, 255]),
};
const model = async () => ({
  width: 2,
  height: 2,
  channels: 3,
  data: new Uint8ClampedArray(12),
});
it("retains a loaded model between warm calls without changing precision", async () => {
  factory.mockResolvedValue(model);
  const { aiUpscale } = await import("./upscale");
  const report = vi.fn();
  await aiUpscale(input, "wasm", () => {}, report);
  expect(report.mock.calls[0][0].warm).toBe(false);
  report.mockClear();
  await aiUpscale(input, "wasm", () => {}, report);
  expect(report.mock.calls[0][0].warm).toBe(true);
  expect(factory).toHaveBeenCalledOnce();
  expect(factory.mock.calls[0][2]).toMatchObject({
    dtype: "fp32",
    device: "wasm",
  });
});
it("does not retain a rejected model initialization", async () => {
  factory
    .mockRejectedValueOnce(new Error("load failed"))
    .mockResolvedValueOnce(model);
  const { aiUpscale } = await import("./upscale");
  await expect(aiUpscale(input, "wasm", () => {})).rejects.toThrow(
    "load failed",
  );
  await expect(aiUpscale(input, "wasm", () => {})).resolves.toMatchObject({
    width: 2,
    height: 2,
  });
  expect(factory).toHaveBeenCalledTimes(2);
});
