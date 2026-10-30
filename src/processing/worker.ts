/// <reference lib="webworker" />
import { analyze } from "./analysis";
import { processPixels } from "./transfer";
import { renderPixels } from "./pipeline";
import { transformGeometry } from "./geometry";
import { createLut, cubeText, sampleLut } from "./lut";
self.onmessage = async ({ data: m }) => {
  try {
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
            if (m.file) self.postMessage({ progress: v * 0.9 });
          },
        )
      : null;
    const result =
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
      self.postMessage({ result: blob });
    } else if (m.document)
      self.postMessage({ result: { pixels: result, width, height, before } }, [
        result.buffer,
        ...(before ? [before.buffer] : []),
      ]);
    else self.postMessage({ result }, [result.buffer]);
  } catch (e) {
    self.postMessage({
      error: e instanceof Error ? e.message : "Image processing failed.",
    });
  }
};
