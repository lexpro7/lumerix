import { afterEach, expect, it, vi } from "vitest";
class FakeWorker {
  static all: FakeWorker[] = [];
  onmessage: ((v: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() {
    FakeWorker.all.push(this);
  }
  send(data: unknown) {
    this.onmessage?.({ data });
  }
}
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
  FakeWorker.all = [];
});
async function setup() {
  vi.useFakeTimers();
  vi.stubGlobal("Worker", FakeWorker);
  return import("./client");
}
const request = { kind: "enhance", mode: "ai" };
it("reuses only idle sessions; completed cancellation cannot kill a later job", async () => {
  const { job } = await setup();
  const a = job(request);
  const worker = FakeWorker.all[0];
  worker.send({ result: 1 });
  await a.promise;
  const b = job(request);
  expect(FakeWorker.all).toHaveLength(1);
  a.cancel();
  expect(worker.terminate).not.toHaveBeenCalled();
  worker.send({ result: 2 });
  expect(await b.promise).toBe(2);
  vi.advanceTimersByTime(60000);
  expect(worker.terminate).toHaveBeenCalledOnce();
});
it("terminates cancelled inference and never reuses its worker", async () => {
  const { job } = await setup();
  const a = job(request);
  const rejected = expect(a.promise).rejects.toThrow("Cancelled");
  a.cancel();
  await rejected;
  const b = job(request);
  expect(FakeWorker.all).toHaveLength(2);
  FakeWorker.all[1].send({ result: 1 });
  await b.promise;
});
it("does not share an active worker and forwards backend metrics", async () => {
  const { job } = await setup();
  const metrics = vi.fn();
  const a = job(request, undefined, metrics),
    b = job(request);
  expect(FakeWorker.all).toHaveLength(2);
  FakeWorker.all[0].send({ metrics: { backend: "webgpu" } });
  expect(metrics).toHaveBeenCalledWith({ backend: "webgpu" });
  FakeWorker.all[0].send({ result: 1 });
  FakeWorker.all[1].send({ result: 2 });
  await Promise.all([a.promise, b.promise]);
  expect(FakeWorker.all[0].terminate).toHaveBeenCalledOnce();
});
it("retries GPU failure in a fresh CPU worker and forwards metrics", async () => {
  const { job } = await setup();
  const metrics = vi.fn();
  const a = job(request, undefined, metrics);
  FakeWorker.all[0].send({ retryCpu: true });
  expect(FakeWorker.all[0].terminate).toHaveBeenCalledOnce();
  expect(FakeWorker.all[1].postMessage).toHaveBeenCalledWith({
    ...request,
    backend: "wasm",
  });
  FakeWorker.all[1].send({ metrics: { backend: "wasm" } });
  FakeWorker.all[1].send({ result: 2 });
  expect(await a.promise).toBe(2);
  expect(metrics).toHaveBeenCalledWith({ backend: "wasm" });
});
