import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pipeline } = vi.hoisted(() => ({ pipeline: vi.fn() }));
vi.mock("@huggingface/transformers", () => ({
  pipeline,
  env: { backends: { onnx: { wasm: {} } } },
  RawImage: class {
    constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
  },
}));

let scope: { onmessage: (event: { data: any }) => Promise<void>; postMessage: ReturnType<typeof vi.fn> };
function request(id: number, backend = "wasm") {
  return scope.onmessage({ data: {
    id, backend, imageId: `photo-${id}`, width: 2, height: 2,
    pixels: new Uint8ClampedArray(16),
  } });
}
function segmenter() {
  return Object.assign(vi.fn().mockResolvedValue([
    { label: "sky", mask: { width: 2, height: 2, data: new Uint8ClampedArray(4) } },
  ]), { dispose: vi.fn().mockResolvedValue(undefined) });
}
beforeEach(async () => {
  vi.resetModules(); pipeline.mockReset();
  scope = { onmessage: async () => {}, postMessage: vi.fn() };
  vi.stubGlobal("self", scope); vi.stubGlobal("navigator", { gpu: {} });
  await import("./worker");
});
afterEach(() => vi.unstubAllGlobals());

describe("semantic worker lifecycle", () => {
  it.each(["wasm", "webgpu"])("retries rejected %s model initialization", async backend => {
    pipeline.mockRejectedValueOnce(new Error("load failed")).mockResolvedValueOnce(segmenter());
    await request(1, backend);
    expect(scope.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 1, error: "load failed" }));
    await request(2, backend);
    expect(pipeline).toHaveBeenCalledTimes(2);
    expect(scope.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 2, result: expect.any(Array) }));
  });
  it("does not initialize a second model during an outstanding load", async () => {
    let resolve!: (value: ReturnType<typeof segmenter>) => void;
    pipeline.mockImplementation(() => new Promise(r => { resolve = r; }));
    const first = request(1); await Promise.resolve();
    await request(2);
    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(scope.postMessage).toHaveBeenCalledWith({ id: 2, error: "Selection is already running" });
    resolve(segmenter()); await first;
  });
  it("requests a clean CPU worker after GPU initialization failure", async () => {
    pipeline.mockRejectedValueOnce(new Error("no GPU adapter"));
    await request(1, "auto");
    expect(scope.postMessage).toHaveBeenCalledWith({ id: 1, retryCpu: true });
  });
  it("does not wait on GPU disposal after inference failure", async () => {
    const model = segmenter();
    model.mockRejectedValueOnce(new Error("GPU lost"));
    model.dispose.mockImplementation(() => new Promise(() => {}));
    pipeline.mockResolvedValueOnce(model);
    await request(1, "auto");
    expect(model.dispose).not.toHaveBeenCalled();
    expect(scope.postMessage).toHaveBeenCalledWith({ id: 1, retryCpu: true });
  });
});
