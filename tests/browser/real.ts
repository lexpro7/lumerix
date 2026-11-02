import { decode, type Photo } from "../../src/processing/decode";
import {
  semanticSegments,
  portraitSegments,
  disposeAI,
  type Segment,
} from "../../src/ai/client";
import { job } from "../../src/processing/client";
import type { Analysis } from "../../src/processing/analysis";
import { freshDocument } from "../../src/editor/types";
import type { RenderResult } from "../../src/editor/usePreview";
import { exportPhoto } from "../../src/processing/export";
import { makeMask, sampleMask } from "../../src/processing/masks";
import { useEditor } from "../../src/store";
const out = document.querySelector("#results")!;
const report = (s: string) => {
  out.textContent += "\n" + s;
};
const check = (v: boolean, label: string) => {
  if (!v) throw new Error(label);
  report("PASS: " + label);
};
async function photo(name: string) {
  const response = await fetch("/tests/fixtures/" + name);
  if (!response.ok) throw new Error("Fixture unavailable");
  return decode(
    new File([await response.blob()], name, {
      type: name.endsWith(".png") ? "image/png" : "image/jpeg",
    }),
  );
}
function show(p: Photo, segment?: Segment) {
  const c = document.querySelector<HTMLCanvasElement>("#preview")!;
  c.width = p.preview.width;
  c.height = p.preview.height;
  const pixels = new Uint8ClampedArray(p.preview.data);
  if (segment)
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4,
          a =
            sampleMask(
              segment.data,
              segment.width,
              segment.height,
              (x + 0.5) / c.width,
              (y + 0.5) / c.height,
            ) * 0.5;
        pixels[i] = pixels[i] * (1 - a) + 220 * a;
        pixels[i + 1] *= 1 - a;
        pixels[i + 2] = pixels[i + 2] * (1 - a) + 255 * a;
      }
  c.getContext("2d")!.putImageData(
    new ImageData(pixels, c.width, c.height),
    0,
    0,
  );
}
for (const kind of ["portrait", "semantic"])
  for (const gpu of [false, true]) {
    document
      .querySelector(`#real-${kind}${gpu ? "-gpu" : ""}`)!
      .addEventListener("click", async () => {
        out.textContent = `Actual ${kind} inference on a NASA photograph. Requested ${gpu ? "GPU" : "CPU"}; no accuracy benchmark claim.`;
        let p: Photo | undefined;
        const start = performance.now();
        let beats = 0;
        const heartbeat = setInterval(() => beats++, 100);
        disposeAI();
        try {
          p = await photo(kind === "portrait" ? "astronaut.png" : "rocket.jpg");
          show(p);
          const infer =
            kind === "portrait" ? portraitSegments : semanticSegments;
          const segments = await infer(p, report, gpu ? "webgpu" : "wasm");
          const selection = segments.find(
            (s) => s.label === (kind === "portrait" ? "person" : "sky"),
          );
          check(!!selection, "Expected semantic class returned");
          const s = selection!;
          check(
            s.data.length === s.width * s.height,
            "Mask buffer matches dimensions",
          );
          const coverage =
            s.data.reduce((sum, v) => sum + (v > 128 ? 1 : 0), 0) /
            s.data.length;
          check(
            coverage > 0.01 && coverage < 0.95,
            "Nonempty, non-full photographic selection",
          );
          check(
            Math.abs(s.width / s.height - p.width / p.height) < 0.02,
            "Mask preserves source aspect ratio",
          );
          const point = (x: number, y: number) =>
            sampleMask(s.data, s.width, s.height, x, y);
          if (kind === "portrait")
            check(
              point(0.48, 0.3) > 0.5 && point(0.95, 0.05) < 0.5,
              "Person includes face and excludes background probe",
            );
          else
            check(
              point(0.15, 0.1) > 0.5 && point(0.5, 0.95) < 0.5,
              "Sky includes upper sky and excludes lower launchpad probe",
            );
          show(p, s);
          report(
            `Coverage ${(coverage * 100).toFixed(1)}%; dimensions ${s.width}x${s.height}`,
          );
          const again = await infer(p, report, gpu ? "webgpu" : "wasm");
          check(
            again.length === segments.length,
            "Repeated image returns cached analysis",
          );
          report(
            `Elapsed ${((performance.now() - start) / 1000).toFixed(1)}s; main-thread heartbeats ${beats}`,
          );
          report(
            "PHOTOGRAPH MODEL CHECK PASSED (inspect overlay; no ground-truth IoU score)",
          );
        } catch (e) {
          report("FAIL: " + String(e));
        } finally {
          clearInterval(heartbeat);
          disposeAI();
          if (p) URL.revokeObjectURL(p.url);
        }
      });
  }
document
  .querySelector("#real-workflow")!
  .addEventListener("click", async () => {
    out.textContent =
      "Real photograph editing/export pipeline (module integration, not a UI click test).";
    let p: Photo | undefined, r: Photo | undefined;
    try {
      p = await photo("astronaut.png");
      r = await photo("rocket.jpg");
      const source = await job<Analysis>({
        kind: "analyze",
        pixels: p.preview.data,
      }).promise;
      const reference = await job<Analysis>({
        kind: "analyze",
        pixels: r.preview.data,
      }).promise;
      const doc = freshDocument();
      doc.params.exposure = 0.3;
      doc.params.clarity = 10;
      doc.style.mixer[0].hue = 15;
      doc.style.grading[0] = { hue: 210, amount: 12 };
      doc.style.palette = ["#203050", "#ddaa77"];
      doc.style.paletteStrength = 10;
      const mask = makeMask(p.width, p.height);
      mask.feather = 8;
      for (let y = 0; y < mask.height; y++)
        for (let x = 0; x < mask.width; x++)
          if (x < mask.width * 0.55) mask.data[y * mask.width + x] = 255;
      mask.adjustments.exposure = 0.25;
      doc.masks = [mask];
      doc.geometry = {
        ...doc.geometry,
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8,
        rotation: 90,
        flipX: true,
      };
      const s = useEditor.getState();
      s.newImage();
      s.apply(doc.params, doc.style);
      s.setGeometry(doc.geometry);
      s.setMasks(doc.masks);
      s.undo();
      check(useEditor.getState().masks.length === 0, "Undo mask edit");
      s.redo();
      check(useEditor.getState().masks.length === 1, "Redo mask edit");
      const render = await job<RenderResult>({
        pixels: p.preview.data,
        width: p.preview.width,
        height: p.preview.height,
        document: doc,
        source,
        reference,
      }).promise;
      check(
        render.pixels.some((v, i) => i % 4 !== 3 && v !== render.before[i]),
        "Color DNA, HSL, grading, palette and local edits produce changed pixels",
      );
      for (const format of ["image/png", "image/jpeg"]) {
        const blob = await exportPhoto(
          p,
          source,
          reference,
          doc.params,
          format,
          0.95,
          () => {},
          doc,
        ).promise;
        const bitmap = await createImageBitmap(blob);
        check(
          bitmap.width === render.width && bitmap.height === render.height,
          format + " crop dimensions",
        );
        const c = new OffscreenCanvas(render.width, render.height),
          ctx = c.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        let delta = 0;
        for (let i = 0; i < pixels.length; i++)
          if (i % 4 !== 3) delta += Math.abs(pixels[i] - render.pixels[i]);
        delta /= c.width * c.height * 3;
        report(`${format} mean RGB error ${delta.toFixed(3)}/255`);
        check(
          delta < (format === "image/png" ? 0.01 : 5),
          format + " exported pixels match preview",
        );
        c.width = c.height = 1;
      }
      const lut = await job<{ blob: Blob }>({
        kind: "lut",
        document: doc,
        source,
        reference,
        size: 33,
        name: "Real workflow",
        pixels: p.preview.data,
      }).promise;
      check(
        (await lut.blob.text()).includes("LUT_3D_SIZE 33"),
        "33-cube LUT export",
      );
      const c = document.querySelector<HTMLCanvasElement>("#preview")!;
      c.width = render.width;
      c.height = render.height;
      c.getContext("2d")!.putImageData(
        new ImageData(
          new Uint8ClampedArray(render.pixels),
          render.width,
          render.height,
        ),
        0,
        0,
      );
      report("REAL PHOTOGRAPH WORKFLOW PASSED");
    } catch (e) {
      report("FAIL: " + String(e));
    } finally {
      if (p) URL.revokeObjectURL(p.url);
      if (r) URL.revokeObjectURL(r.url);
    }
  });

document.querySelector("#real-auto")!.addEventListener("click", async () => {
  out.textContent = "Actual model initialization and automatic fallback check.";
  let p: Photo | undefined;
  try {
    p = await photo("rocket.jpg");
    const result = await semanticSegments(p, report, "auto");
    check(
      result.some((s) => s.label === "sky"),
      "Automatic backend returns real sky mask",
    );
    report("AUTO MODEL CHECK PASSED");
  } catch (e) {
    report("FAIL: " + String(e));
  } finally {
    disposeAI();
    if (p) URL.revokeObjectURL(p.url);
  }
});
document.querySelector("#real-load")!.addEventListener("click", async () => {
  out.textContent =
    "12 MP workload made by enlarging a public photograph. Measures responsiveness, not native-image detail or peak process memory.";
  let p: Photo | undefined;
  let beats = 0;
  const timer = setInterval(() => beats++, 100);
  const started = performance.now();
  try {
    const response = await fetch("/tests/fixtures/astronaut.png"),
      bitmap = await createImageBitmap(await response.blob());
    const c = new OffscreenCanvas(4000, 3000);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    bitmap.close();
    const blob = await c.convertToBlob({ type: "image/jpeg", quality: 0.95 });
    c.width = c.height = 1;
    p = await decode(
      new File([blob], "large-fixture.jpg", { type: "image/jpeg" }),
    );
    check(
      p.width === 4000 && p.height === 3000 && p.preview.width === 1440,
      "12 MP decode and bounded preview",
    );
    const source = await job<Analysis>({
        kind: "analyze",
        pixels: p.preview.data,
      }).promise,
      doc = freshDocument();
    doc.params.clarity = 20;
    doc.params.sharpness = 15;
    doc.params.noise = 10;
    const old = exportPhoto(
      p,
      source,
      null,
      doc.params,
      "image/png",
      1,
      () => {},
      doc,
    );
    old.cancel();
    let cancelled = false;
    try {
      await old.promise;
    } catch {
      cancelled = true;
    }
    check(cancelled, "Large obsolete export cancels");
    const result = await exportPhoto(
      p,
      source,
      null,
      doc.params,
      "image/jpeg",
      0.9,
      () => {},
      doc,
    ).promise;
    const image = await createImageBitmap(result);
    check(
      image.width === 4000 && image.height === 3000,
      "Full 12 MP output after cancellation",
    );
    image.close();
    check(beats > 0, "Main-thread heartbeat continued");
    report(
      `Elapsed ${((performance.now() - started) / 1000).toFixed(1)}s; heartbeats ${beats}; output ${(result.size / 1048576).toFixed(2)} MiB`,
    );
    report(
      "Core RGBA and luminance arrays alone are approximately 229 MiB at 12 MP, excluding canvas/runtime/temporary allocations. Peak process memory was not measured.",
    );
    report("LARGE IMAGE CHECK PASSED");
  } catch (e) {
    report("FAIL: " + String(e));
  } finally {
    clearInterval(timer);
    if (p) URL.revokeObjectURL(p.url);
  }
});
