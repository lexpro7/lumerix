import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelCache } from "./model-cache";
import { disposeAI, portraitSegments, semanticSegments } from "./client";
import type { Photo } from "../processing/decode";
class FakeWorker {
  static instances: FakeWorker[] = [];
  static startupFailure = false;
  onmessage: ((event: { data: any }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  message: any;
  terminated = false;
  constructor() {
    if (FakeWorker.startupFailure) throw new Error("startup failed");
    FakeWorker.instances.push(this);
  }
  postMessage(message: any) {
    this.message = message;
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: object) {
    this.onmessage?.({ data: { id: this.message.id, ...data } });
  }
}
const photo = {
  url: "image-a",
  preview: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
} as Photo;
const segments = [
  { label: "sky", width: 2, height: 2, data: new Uint8ClampedArray(4) },
];
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("Worker", FakeWorker);
  FakeWorker.instances = [];
  FakeWorker.startupFailure = false;
});
afterEach(() => {
  disposeAI();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("retryable model initialization", () => {
  it("shares concurrent loading and retries a rejected initialization", async () => {
    const cache = new ModelCache<number>();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("download"))
      .mockResolvedValue(7);
    const a = cache.get(load),
      b = cache.get(load);
    expect(a).toBe(b);
    await expect(a).rejects.toThrow("download");
    expect(await cache.get(load)).toBe(7);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it("an obsolete rejection cannot erase a newer initialization", async () => {
    const cache = new ModelCache<number>();
    let fail!: (e: Error) => void;
    const old = cache.get(
      () =>
        new Promise<number>((_, reject) => {
          fail = reject;
        }),
    );
    await Promise.resolve();
    cache.clear();
    const current = cache.get(async () => 8);
    fail(new Error("old"));
    await expect(old).rejects.toThrow();
    expect(cache.get(async () => 9)).toBe(current);
    expect(await current).toBe(8);
  });
});
describe("AI worker ownership", () => {
  it("cancels an in-flight CPU fallback when the photo changes", async () => {
    const old = semanticSegments(photo, () => {});
    const rejected = expect(old).rejects.toThrow("cancelled");
    FakeWorker.instances[0].reply({ retryCpu: true });
    const cpu = FakeWorker.instances[1], late = cpu.onmessage!;
    disposeAI();
    const next = semanticSegments({ ...photo, url: "replacement" }, () => {});
    late({ data: { id: cpu.message.id, result: segments } });
    FakeWorker.instances[2].reply({ result: segments });
    await rejected;
    expect(cpu.terminated).toBe(true);
    await expect(next).resolves.toEqual(segments);
  });
  it("restarts in a clean worker after GPU provider failure", async () => {
    const p = semanticSegments(photo, () => {}, "auto");
    const gpu = FakeWorker.instances[0]; gpu.reply({ retryCpu: true });
    expect(gpu.terminated).toBe(true);
    const cpu = FakeWorker.instances[1]; expect(cpu.message.backend).toBe("wasm");
    cpu.reply({ result: segments }); await expect(p).resolves.toEqual(segments);
  });
  it("terminates an obsolete job and ignores its late response", async () => {
    const a = semanticSegments(photo, () => {});
    const rejection = expect(a).rejects.toThrow("cancelled");
    const old = FakeWorker.instances[0];
    const late = old.onmessage!;
    const b = semanticSegments({ ...photo, url: "image-b" }, () => {});
    await rejection;
    expect(old.terminated).toBe(true);
    late({ data: { id: old.message.id, result: segments } });
    const next = FakeWorker.instances[1];
    next.reply({ result: segments });
    expect(await b).toEqual(segments);
  });
  it("releases a failed worker and succeeds on retry", async () => {
    const a = semanticSegments(photo, () => {});
    FakeWorker.instances[0].reply({ error: "model loading failed" });
    await expect(a).rejects.toThrow("Retry");
    expect(FakeWorker.instances[0].terminated).toBe(true);
    const b = semanticSegments(photo, () => {});
    FakeWorker.instances[1].reply({ result: segments });
    expect(await b).toEqual(segments);
  });
  it("recovers from worker construction failure", async () => {
    FakeWorker.startupFailure = true;
    await expect(portraitSegments(photo, () => {})).rejects.toThrow("startup");
    FakeWorker.startupFailure = false;
    const p = portraitSegments(photo, () => {});
    FakeWorker.instances[0].reply({ result: segments });
    await expect(p).resolves.toEqual(segments);
  });
  it("cancels portrait processing as well as semantic processing", async () => {
    const p = portraitSegments(photo, () => {});
    disposeAI();
    await expect(p).rejects.toThrow("cancelled");
    expect(FakeWorker.instances[0].terminated).toBe(true);
  });
  it("terminates timed-out inference and allows another request", async () => {
    const p = semanticSegments(photo, () => {});
    const rejection = expect(p).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(180000);
    await rejection;
    expect(FakeWorker.instances[0].terminated).toBe(true);
    const next = semanticSegments(photo, () => {});
    FakeWorker.instances[1].reply({ result: segments });
    await expect(next).resolves.toEqual(segments);
  });
  it("reuses idle models but rejects mismatched response IDs", async () => {
    const a = semanticSegments(photo, () => {});
    FakeWorker.instances[0].reply({ result: segments });
    await a;
    const status = vi.fn(),
      b = semanticSegments(photo, status);
    const w = FakeWorker.instances[0];
    w.reply({ id: -1, status: "stale" });
    expect(status).not.toHaveBeenCalledWith("stale");
    w.reply({ result: segments });
    await b;
    expect(FakeWorker.instances.length).toBe(1);
  });
});
