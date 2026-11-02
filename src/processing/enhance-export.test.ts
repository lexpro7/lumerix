import { afterEach, expect, it, vi } from "vitest";
const upscale = vi.hoisted(() => ({
  fastUpscale: vi.fn(),
  aiUpscale: vi.fn(),
  GPUUpscaleError: class extends Error {},
}));
vi.mock("./upscale", () => upscale);
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});
it.each(["image/png", "image/jpeg"])(
  "exports cached %s without another upscale",
  async (format) => {
    const saved = new Blob(["lossless result"], { type: "image/png" });
    const encoded = new Blob(["encoded JPEG"], { type: "image/jpeg" });
    const postMessage = vi.fn(),
      close = vi.fn(),
      drawImage = vi.fn(),
      convertToBlob = vi.fn(async () => encoded);
    const canvases: { width: number; height: number }[] = [];
    vi.stubGlobal("self", { postMessage });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ close })),
    );
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        constructor(
          public width: number,
          public height: number,
        ) {
          canvases.push(this);
        }
        getContext() {
          return { drawImage, fillRect: vi.fn(), fillStyle: "" };
        }
        convertToBlob = convertToBlob;
      },
    );
    await import("./worker");
    await (self.onmessage as unknown as (event: unknown) => Promise<void>)({
      data: {
        file: new Blob(),
        format,
        quality: 0.85,
        document: {
          enhanced: {
            blob: saved,
            before: new Blob(),
            width: 1024,
            height: 768,
          },
        },
      },
    });
    expect(upscale.fastUpscale).not.toHaveBeenCalled();
    expect(upscale.aiUpscale).not.toHaveBeenCalled();
    expect(canvases[0]).toMatchObject({ width: 1024, height: 768 });
    expect(close).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenLastCalledWith({
      result: format === "image/png" ? saved : encoded,
    });
    if (format === "image/jpeg")
      expect(convertToBlob).toHaveBeenCalledWith({
        type: format,
        quality: 0.85,
      });
    else expect(convertToBlob).not.toHaveBeenCalled();
  },
);
