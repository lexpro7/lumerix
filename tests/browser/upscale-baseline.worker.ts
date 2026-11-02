/// <reference lib="webworker" />
import { aiUpscale, GPUUpscaleError } from "../../scripts/upscale-baseline";
self.onmessage = async ({ data }) => {
  try {
    const result = await aiUpscale(
      data,
      data.backend,
      (p) => self.postMessage({ progress: p }),
      (backend) => self.postMessage({ metrics: { backend, warm: false } }),
    );
    self.postMessage({ result }, [result.pixels.buffer]);
  } catch (e) {
    self.postMessage(
      e instanceof GPUUpscaleError && data.backend !== "wasm"
        ? { retryCpu: true }
        : { error: String(e) },
    );
  }
};
