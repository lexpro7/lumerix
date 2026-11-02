/// <reference lib="webworker" />
import { analyze } from "./analysis";
import { processPixels } from "./transfer";
import { renderPixels } from "./pipeline";
import { transformGeometry } from "./geometry";
import { createLut, cubeText, sampleLut } from "./lut";
import { fastUpscale, aiUpscale, GPUUpscaleError } from "./upscale";
self.onmessage = async ({ data: m }) => {
  const started = performance.now();
  let metrics: import("./upscale").UpscaleMetrics | undefined;
  const report = (value: import("./upscale").UpscaleMetrics) => {
    metrics = value;
    self.postMessage({ metrics: value });
  };
  try {
    if (m.document?.enhanced) {
      const saved = m.document.enhanced;
      const bitmap = await createImageBitmap(saved.blob);
      const canvas = new OffscreenCanvas(saved.width, saved.height);
      const ctx = canvas.getContext("2d")!;
      if (m.format === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      if (m.file) {
        self.postMessage({ progress: 0.9 });
        self.postMessage({
          result:
            m.format === "image/png"
              ? saved.blob
              : await canvas.convertToBlob({
                  type: m.format,
                  quality: m.quality,
                }),
        });
      } else {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const original = await createImageBitmap(saved.before);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
        original.close();
        const before = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        self.postMessage(
          {
            result: {
              pixels,
              before,
              width: canvas.width,
              height: canvas.height,
              upscaled: true,
            },
          },
          [pixels.buffer, before.buffer],
        );
      }
      return;
    }
    if (m.kind === "enhance") {
      const input = { pixels: m.pixels, width: m.width, height: m.height };
      const result =
        m.mode === "ai"
          ? await aiUpscale(
              input,
              m.backend ?? "auto",
              (v) => self.postMessage({ progress: v }),
              report,
            )
          : fastUpscale(input);
      self.postMessage({ result }, [result.pixels.buffer]);
      return;
    }
    if (m.kind === "lut") {
      const values = createLut(m.document, m.source, m.reference, m.size);
      const result = new Blob([cubeText(values, m.size, m.name)], {
        type: "text/plain",
      });
      const preview = new Uint8ClampedArray(m.pixels.length);
      for (let i = 0; i < preview.length; i += 4) {
        const rgb = sampleLut(values, m.size, [
          m.pixels[i],
          m.pixels[i + 1],
          m.pixels[i + 2],
        ]);
        preview.set(rgb, i);
        preview[i + 3] = m.pixels[i + 3];
      }
      self.postMessage({ result: { blob: result, preview } }, [preview.buffer]);
      return;
    }
    if (m.kind === "analyze") {
      self.postMessage({ result: analyze(m.pixels) });
      return;
    }
    let pixels: Uint8ClampedArray = m.pixels,
      width = m.width,
      height = m.height;
    if (m.file) {
      const bitmap = await createImageBitmap(m.file, {
        imageOrientation: "from-image",
      });
      width = bitmap.width;
      height = bitmap.height;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      pixels = ctx.getImageData(0, 0, width, height).data;
      canvas.width = canvas.height = 1;
    }
    const processed = m.document
      ? renderPixels(
          pixels,
          width,
          height,
          m.document,
          m.source,
          m.reference,
          (v) => {
            if (m.file)
              self.postMessage({
                progress:
                  v *
                  (m.document?.upscale && m.document.upscale !== "none"
                    ? 0.3
                    : 0.9),
              });
          },
        )
      : null;
    let result =
      processed?.pixels ??
      processPixels(pixels, m.source, m.reference, m.params, (v) => {
        if (m.file) self.postMessage({ progress: v * 0.9 });
      });
    const before =
      m.document && !m.file
        ? transformGeometry(pixels, width, height, m.document.geometry).pixels
        : undefined;
    if (processed) {
      width = processed.width;
      height = processed.height;
    }
    if (m.file) {
      let originalBlob: Blob | undefined;
      if (m.kind === "apply-enhance") {
        const original = new OffscreenCanvas(width, height);
        original
          .getContext("2d")!
          .putImageData(new ImageData(result, width, height), 0, 0);
        originalBlob = await original.convertToBlob({ type: "image/png" });
        original.width = original.height = 1;
      }
      if (m.document?.upscale && m.document.upscale !== "none") {
        const input = { pixels: result, width, height };
        const enlarged =
          m.document.upscale === "ai"
            ? await aiUpscale(
                input,
                m.backend ?? "auto",
                (v) => self.postMessage({ progress: 0.3 + v * 0.6 }),
                report,
              )
            : fastUpscale(input);
        result = enlarged.pixels;
        width = enlarged.width;
        height = enlarged.height;
      }
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;
      if (m.format === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        const layer = new OffscreenCanvas(width, height);
        layer
          .getContext("2d")!
          .putImageData(new ImageData(result, width, height), 0, 0);
        ctx.drawImage(layer, 0, 0);
      } else ctx.putImageData(new ImageData(result, width, height), 0, 0);
      const blob = await canvas.convertToBlob({
        type: m.format,
        quality: m.quality,
      });
      self.postMessage({
        result: originalBlob
          ? {
              blob,
              before: originalBlob,
              width,
              height,
              metrics,
              elapsedMs: performance.now() - started,
            }
          : blob,
      });
    } else if (m.document)
      self.postMessage({ result: { pixels: result, width, height, before } }, [
        result.buffer,
        ...(before ? [before.buffer] : []),
      ]);
    else self.postMessage({ result }, [result.buffer]);
  } catch (e) {
    if (e instanceof GPUUpscaleError && m.backend !== "wasm") {
      self.postMessage({ retryCpu: true });
      return;
    }
    self.postMessage({
      error: e instanceof Error ? e.message : "Image processing failed.",
    });
  }
};
