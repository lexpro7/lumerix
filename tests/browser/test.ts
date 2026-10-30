import { decode, type Photo } from "../../src/processing/decode";
import { job } from "../../src/processing/client";
import type { Analysis } from "../../src/processing/analysis";
import { freshDocument } from "../../src/editor/types";
import { exportPhoto } from "../../src/processing/export";
import { makeMask } from "../../src/processing/masks";
import type { RenderResult } from "../../src/editor/usePreview";
const output = document.querySelector("#results")!;
const report = (text: string) => {
  output.textContent += "\n" + text;
};
async function fixture(): Promise<Photo> {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 1000;
  const ctx = c.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, c.width, c.height);
  gradient.addColorStop(0, "#72a8db");
  gradient.addColorStop(0.55, "#d1b981");
  gradient.addColorStop(1, "#364b39");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f0c8ae";
  ctx.fillRect(700, 150, 200, 400);
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!)));
  return decode(
    new File([blob], "synthetic-fixture.png", { type: "image/png" }),
  );
}
function check(condition: boolean, label: string) {
  if (!condition) throw new Error(label);
  report("PASS: " + label);
}
document.querySelector("#pipeline")!.addEventListener("click", async () => {
  output.textContent = "Running real browser image pipeline…";
  let photo: Photo | null = null;
  try {
    for (const type of ['text/plain', 'image/png']) {
      let rejected = false;
      try { await decode(new File(['invalid image'], 'invalid', { type })); }
      catch { rejected = true; }
      check(rejected, `Rejects invalid ${type} input`);
    }
    photo = await fixture();
    check(
      photo.width === 1600 && photo.preview.width === 1440,
      "Original and preview dimensions differ correctly",
    );
    const source = await job<Analysis>({
        kind: "analyze",
        pixels: photo.preview.data,
      }).promise,
      doc = freshDocument();
    const cancelled = job({ kind: 'analyze', pixels: photo.preview.data });
    cancelled.cancel();
    let cancellation = false;
    try { await cancelled.promise; } catch (error) { cancellation = error instanceof Error && error.message === 'Cancelled'; }
    check(cancellation, 'Cancelled worker rejects without returning stale output');
    doc.params.exposure = 0.5;
    doc.params.clarity = 15;
    doc.geometry = { ...doc.geometry, width: 0.5, rotation: 90 };
    const mask = makeMask(photo.width, photo.height);
    mask.data.fill(255);
    mask.adjustments.warmth = 20;
    doc.masks = [mask];
    const result = await job<RenderResult>({
      pixels: photo.preview.data,
      width: photo.preview.width,
      height: photo.preview.height,
      source,
      reference: null,
      document: doc,
    }).promise;
    check(
      result.width === 900 && result.height === 720,
      "Worker preview applies crop and rotation",
    );
    check(
      result.pixels.some((v, i) => i % 4 !== 3 && v !== result.before[i]),
      "Preview pixels change under global and masked edits",
    );
    const canvas = document.querySelector<HTMLCanvasElement>("#preview")!;
    canvas.width = result.width;
    canvas.height = result.height;
    canvas
      .getContext("2d")!
      .putImageData(
        new ImageData(
          new Uint8ClampedArray(result.pixels),
          result.width,
          result.height,
        ),
        0,
        0,
      );
    for (const format of ["image/png", "image/jpeg"]) {
      const blob = await exportPhoto(
        photo,
        source,
        null,
        doc.params,
        format,
        0.9,
        () => {},
        doc,
      ).promise;
      const bitmap = await createImageBitmap(blob);
      check(
        bitmap.width === 1000 && bitmap.height === 800,
        `${format}: original-resolution crop/rotation dimensions`,
      );
      check(blob.type === format, `${format}: actual encoded output format`);
      const comparison = document.createElement('canvas');
      comparison.width = result.width; comparison.height = result.height;
      const context = comparison.getContext('2d')!;
      context.drawImage(bitmap, 0, 0, result.width, result.height);
      const exported = context.getImageData(0, 0, result.width, result.height).data;
      let total = 0;
      for (let i=0;i<exported.length;i++) if (i%4!==3) total += Math.abs(exported[i]-result.pixels[i]);
      const meanError = total/(result.width*result.height*3);
      report(`${format}: preview/export mean RGB error ${meanError.toFixed(3)} / 255`);
      check(meanError < (format === 'image/png' ? 2 : 4), `${format}: exported pixels agree with edited preview`);
      comparison.width = comparison.height = 1;
      bitmap.close();
    }
    const lut = await job<{ blob: Blob; preview: Uint8ClampedArray }>({
      kind: "lut",
      document: doc,
      source,
      reference: null,
      size: 17,
      name: "Browser test",
      pixels: photo.preview.data,
    }).promise;
    check(
      (await lut.blob.text()).includes("LUT_3D_SIZE 17"),
      "Worker generates parseable cube header",
    );
    check(
      lut.preview.length === photo.preview.data.length,
      "Actual LUT preview returns original framing",
    );
    report("ALL BROWSER PIPELINE CHECKS PASSED");
  } catch (e) {
    report("FAIL: " + String(e));
  } finally {
    if (photo) URL.revokeObjectURL(photo.url);
  }
});
for (const kind of ["portrait", "semantic"])
  document.querySelector("#" + kind)!.addEventListener("click", async () => {
    output.textContent = `Running real ${kind} inference on a synthetic fixture. No accuracy claim is made for this fixture.`;
    let photo: Photo | null = null;
    try {
      photo = await fixture();
      const ai = await import("../../src/ai/client");
      const segments =
        kind === "portrait"
          ? await ai.portraitSegments(photo, report)
          : await ai.semanticSegments(photo, report);
      check(segments.length > 0, "Model returned real segmentation outputs");
      for (const s of segments)
        report(
          `${s.label}: ${s.width} × ${s.height}, ${s.data.filter((v) => v > 128).length} selected pixels`,
        );
      const again =
        kind === "portrait"
          ? await ai.portraitSegments(photo, report)
          : await ai.semanticSegments(photo, report);
      check(
        again.length === segments.length,
        "Repeated inference reuses the image analysis cache",
      );
      report("MODEL RUNTIME CHECK PASSED");
    } catch (e) {
      report("FAIL: " + String(e));
    } finally {
      if (photo) URL.revokeObjectURL(photo.url);
    }
  });
