import { describe, it, expect, beforeEach } from "vitest";
import {
  freshDocument,
  defaultGeometry,
  normalizeStyle,
} from "../editor/types";
import {
  makeMask,
  paintMask,
  combineMasks,
  prepareMask,
  sampleMask,
  strokePoints,
} from "./masks";
import {
  geometryDimensions,
  outputToSource,
  transformGeometry,
} from "./geometry";
import { analyze } from "./analysis";
import { globalTransform, matchTone, toneAnchors } from "./global";
import { createLut, cubeText, sampleLut } from "./lut";
import { renderPixels } from "./pipeline";
import { processPixels } from "./transfer";
import { useEditor } from "../store";
import type { Triple } from "./color";
const pixels = new Uint8ClampedArray([
  25, 45, 65, 255, 80, 100, 120, 255, 160, 180, 200, 128, 230, 220, 210, 255,
]);
const analysis = analyze(pixels);
describe("mask operations", () => {
  it("edge refinement does not select an empty mask or hollow a full mask", () => {
    const mask = makeMask(4, 4);
    mask.feather = 0;
    for (const edge of [-100, 100]) {
      expect(prepareMask({ ...mask, edge }).every((v) => v === 0)).toBe(true);
      expect(
        prepareMask({
          ...mask,
          edge,
          data: new Uint8ClampedArray(16).fill(255),
        }).every((v) => v === 255),
      ).toBe(true);
    }
  });
  it("paints and erases without mutating the original mask", () => {
    const mask = makeMask(100, 100);
    const painted = paintMask(mask, [{ x: 0.5, y: 0.5 }], 0.1);
    expect(mask.data.every((v) => v === 0)).toBe(true);
    expect(painted[5050]).toBe(255);
    const erased = paintMask(
      { ...mask, data: painted },
      [{ x: 0.5, y: 0.5 }],
      0.1,
      true,
    );
    expect(erased[5050]).toBe(0);
  });
  it("combines masks as a union or subtraction", () => {
    expect(
      Array.from(
        combineMasks(
          new Uint8ClampedArray([0, 100, 255]),
          new Uint8ClampedArray([255, 200, 100]),
          "add",
        ),
      ),
    ).toEqual([255, 200, 255]);
    expect(
      Array.from(
        combineMasks(
          new Uint8ClampedArray([0, 100, 255]),
          new Uint8ClampedArray([255, 200, 100]),
          "subtract",
        ),
      ),
    ).toEqual([0, 0, 155]);
  });
  it("feathers and inverts with bounded values", () => {
    const mask = makeMask(40, 40);
    mask.data = paintMask(mask, [{ x: 0.5, y: 0.5 }], 0.2);
    mask.feather = 30;
    const normal = prepareMask(mask),
      inverse = prepareMask({ ...mask, invert: true });
    expect(normal.some((v) => v > 0 && v < 255)).toBe(true);
    normal.forEach((v, i) =>
      expect(Math.abs(v + inverse[i] - 255)).toBeLessThanOrEqual(1),
    );
  });
  it("samples the same normalized location at any export resolution", () => {
    const mask = makeMask(4, 4);
    mask.data.fill(255, 0, 8);
    expect(sampleMask(mask.data, 4, 4, 0.5, 0.1)).toBe(1);
    expect(sampleMask(mask.data, 4, 4, 0.5, 0.9)).toBe(0);
    expect(
      strokePoints({ x: 0, y: 0 }, { x: 1, y: 1 }, 0.05).length,
    ).toBeGreaterThan(50);
  });
});
describe("geometry", () => {
  it("does not bleed invisible RGB into fractional crop edges", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 0]);
    const result = transformGeometry(data, 2, 1, {
      ...defaultGeometry,
      x: 0.25,
      width: 0.5,
    });
    expect(Array.from(result.pixels)).toEqual([255, 0, 0, 128]);
  });
  it("preserves identity exactly", () => {
    expect(transformGeometry(pixels, 2, 2, defaultGeometry).pixels).toBe(
      pixels,
    );
  });
  it("crops without altering original and handles horizontal flip", () => {
    const crop = { ...defaultGeometry, x: 0.5, width: 0.5 };
    const result = transformGeometry(pixels, 2, 2, crop);
    expect(result.width).toBe(1);
    expect(Array.from(result.pixels)).toEqual([
      ...pixels.slice(4, 8),
      ...pixels.slice(12, 16),
    ]);
    const flip = transformGeometry(pixels, 2, 2, {
      ...defaultGeometry,
      flipX: true,
    });
    expect(Array.from(flip.pixels.slice(0, 4))).toEqual(
      Array.from(pixels.slice(4, 8)),
    );
  });
  it("rotates dimensions and inverse-maps the same mask location", () => {
    const g = { ...defaultGeometry, rotation: 90 };
    expect(geometryDimensions(8, 4, g)).toMatchObject({ width: 4, height: 8 });
    expect(outputToSource(0.5, 0.5, 8, 4, g)).toMatchObject({ inside: true });
    const p = outputToSource(0.5, 0.5, 8, 4, g);
    expect(p.x).toBeCloseTo(0.5);
    expect(p.y).toBeCloseTo(3.5);
  });
  it("expands canvas for straighten with transparent corners", () => {
    const result = transformGeometry(
      new Uint8ClampedArray(20 * 20 * 4).fill(255),
      20,
      20,
      { ...defaultGeometry, straighten: 45 },
    );
    expect(result.width).toBe(28);
    expect(result.pixels[3]).toBe(0);
  });
});
describe("color matching and pipeline consistency", () => {
  it("zero look strength restores the original including spatial effects", () => {
    const doc = freshDocument();
    Object.assign(doc.params, {
      exposure: 1,
      clarity: 70,
      sharpness: 90,
      noise: 80,
      grain: 60,
      vignette: 80,
    });
    doc.style.lookStrength = 0;
    expect(renderPixels(pixels, 2, 2, doc, analysis, analysis).pixels).toEqual(
      pixels,
    );
  });
  it.each([
    "exposure",
    "contrast",
    "highlights",
    "shadows",
    "warmth",
    "tint",
    "saturation",
    "clarity",
    "sharpness",
  ] as const)("applies local %s only to selected pixels", (key) => {
    const doc = freshDocument(),
      mask = makeMask(2, 2);
    mask.feather = 0;
    const selected = key === "highlights" ? 3 : 0;
    mask.data[selected] = 255;
    mask.adjustments[key] = key === "exposure" ? 1 : 80;
    doc.masks = [mask];
    const result = renderPixels(pixels, 2, 2, doc, analysis, null).pixels;
    expect(result.slice(selected * 4, selected * 4 + 3)).not.toEqual(
      pixels.slice(selected * 4, selected * 4 + 3),
    );
    for (let i = 0; i < 4; i++)
      if (i !== selected)
        expect(result.slice(i * 4, i * 4 + 4)).toEqual(
          pixels.slice(i * 4, i * 4 + 4),
        );
  });
  it("keeps classic processing compatible with the old pipeline", () => {
    const doc = freshDocument(),
      reference = analyze(
        new Uint8ClampedArray([150, 100, 50, 255, 40, 80, 120, 255]),
      );
    expect(renderPixels(pixels, 2, 2, doc, analysis, reference).pixels).toEqual(
      processPixels(pixels, analysis, reference, doc.params),
    );
  });
  it("anchors tonal endpoints and keeps the mapping finite", () => {
    const anchors = toneAnchors(
      analysis,
      analyze(new Uint8ClampedArray([200, 200, 200, 255])),
    );
    expect(matchTone(0, anchors)).toBe(0);
    expect(matchTone(100, anchors)).toBe(100);
    let previous = 0;
    for (let l = 0; l <= 100; l += 0.5) {
      const value = matchTone(l, anchors);
      expect(value).toBeGreaterThanOrEqual(previous - 0.001);
      expect(Number.isFinite(value)).toBe(true);
      previous = value;
    }
  });
  it("uses skin mask to protect transfer without affecting unrelated global edits", () => {
    const doc = freshDocument(),
      ref = analyze(new Uint8ClampedArray([200, 120, 80, 255]));
    doc.style.skinProtection = 100;
    const f = globalTransform(doc.params, doc.style, analysis, ref);
    expect(f([80, 100, 120], 1)).toEqual([80, 100, 120]);
    expect(f([80, 100, 120], 0)).not.toEqual([80, 100, 120]);
  });
  it("applies local exposure only inside an enabled mask and preserves alpha", () => {
    const doc = freshDocument();
    doc.params.strength = 0;
    const mask = makeMask(2, 2);
    mask.feather = 0;
    mask.data[0] = 255;
    mask.adjustments.exposure = 1;
    doc.masks = [mask];
    const out = renderPixels(pixels, 2, 2, doc, analysis, null).pixels;
    expect(out[0]).toBeGreaterThan(pixels[0]);
    expect(Array.from(out.slice(4))).toEqual(Array.from(pixels.slice(4)));
    doc.masks[0] = { ...mask, enabled: false };
    expect(renderPixels(pixels, 2, 2, doc, analysis, null).pixels).toEqual(
      pixels,
    );
  });
  it("keeps local adjustments aligned after geometry", () => {
    const doc = freshDocument(),
      mask = makeMask(2, 2);
    mask.feather = 0;
    mask.data[0] = 255;
    mask.adjustments.exposure = 1;
    doc.masks = [mask];
    const raw = renderPixels(pixels, 2, 2, doc, analysis, null).pixels;
    doc.geometry = { ...defaultGeometry, flipX: true, rotation: 90 };
    const expected = transformGeometry(raw, 2, 2, doc.geometry);
    expect(renderPixels(pixels, 2, 2, doc, analysis, null).pixels).toEqual(
      expected.pixels,
    );
  });
  it("uses identical color math at preview and export scales", () => {
    const doc = freshDocument();
    doc.params.warmth = 20;
    doc.params.exposure = 0.4;
    const m = makeMask(2, 2);
    m.data.fill(255);
    m.adjustments.saturation = 20;
    doc.masks = [m];
    const small = new Uint8ClampedArray([80, 100, 120, 255]),
      large = new Uint8ClampedArray(16);
    for (let i = 0; i < 16; i += 4) large.set(small, i);
    const a = renderPixels(small, 1, 1, doc, analysis, null).pixels,
      b = renderPixels(large, 2, 2, doc, analysis, null).pixels;
    for (let i = 0; i < 16; i += 4)
      expect(Array.from(b.slice(i, i + 4))).toEqual(Array.from(a));
  });
});
describe("LUT interchange", () => {
  it("serializes 17 cubed entries with correct domains and red-fastest ordering", () => {
    const doc = freshDocument();
    const values = createLut(doc, analysis, null, 17),
      text = cubeText(values, 17, 'Test "look"\nhello');
    expect(text).toContain("LUT_3D_SIZE 17");
    expect(text).toContain("DOMAIN_MAX 1.0 1.0 1.0");
    const lines = text
      .trim()
      .split("\n")
      .filter((l) => /^\d/.test(l));
    expect(lines).toHaveLength(17 ** 3);
    expect(lines[1].split(" ").map(Number)).toEqual([0.0625, 0, 0]);
    expect(lines[17].split(" ").map(Number)).toEqual([0, 0.0625, 0]);
    expect(lines[289].split(" ").map(Number)).toEqual([0, 0, 0.0625]);
  });
  it("matches the color transform at every grid point", () => {
    const doc = freshDocument();
    doc.params.warmth = 10;
    doc.params.exposure = 0.3;
    doc.style.curve = [0.02, 0.22, 0.5, 0.8, 0.97];
    doc.style.grading[0] = { hue: 210, amount: 12 };
    const values = createLut(doc, analysis, null, 17),
      f = globalTransform(doc.params, doc.style, analysis, null);
    for (const rgb of [
      [0, 0, 0],
      [255, 255, 255],
      [127.5, 63.75, 191.25],
    ] as Triple[]) {
      const actual = sampleLut(values, 17, rgb),
        expected = f(rgb);
      actual.forEach((v, c) => expect(v).toBeCloseTo(expected[c], 3));
    }
  });
  it("approximates off-grid colors and excludes spatial edits and masks", () => {
    const doc = freshDocument();
    doc.params.warmth = 8;
    doc.params.contrast = 10;
    const base = createLut(doc, analysis, null, 33),
      f = globalTransform(doc.params, doc.style, analysis, null);
    const rgb: Triple = [76, 123, 198];
    sampleLut(base, 33, rgb).forEach((v, c) =>
      expect(Math.abs(v - f(rgb)[c])).toBeLessThan(1),
    );
    doc.params.grain = 80;
    doc.params.sharpness = 70;
    doc.params.clarity = 20;
    doc.params.vignette = 50;
    doc.geometry.rotation = 90;
    doc.masks = [makeMask(2, 2)];
    expect(createLut(doc, analysis, null, 33)).toEqual(base);
  });
});
describe("history and legacy styles", () => {
  beforeEach(() => useEditor.getState().newImage());
  it("does not merge rapid adjustments to different masks into one undo step", () => {
    const s = useEditor.getState(),
      a = makeMask(2, 2),
      b = makeMask(2, 2);
    s.setMasks([a, b]);
    const editedA = { ...a, opacity: 50 },
      editedB = { ...b, opacity: 25 };
    s.setMasks([editedA, b], "Adjust mask opacity");
    s.setMasks([editedA, editedB], "Adjust mask opacity");
    s.undo();
    expect(useEditor.getState().masks.map((m) => m.opacity)).toEqual([50, 100]);
  });
  it("normalizes legacy presets while leaving geometry and masks unchanged", () => {
    const state = useEditor.getState();
    state.setGeometry({ ...defaultGeometry, rotation: 90 });
    state.apply({ exposure: 1 });
    expect(useEditor.getState().params.tint).toBe(0);
    expect(useEditor.getState().geometry.rotation).toBe(90);
    expect(normalizeStyle().mixer).toHaveLength(8);
  });
  it("undoes and redoes geometry, masks and color edits", () => {
    const s = useEditor.getState();
    s.set("exposure", 1);
    s.setGeometry({ ...defaultGeometry, rotation: 90 });
    s.setMasks([makeMask(4, 4)]);
    s.undo();
    expect(useEditor.getState().masks).toHaveLength(0);
    s.undo();
    expect(useEditor.getState().geometry.rotation).toBe(0);
    s.redo();
    expect(useEditor.getState().geometry.rotation).toBe(90);
    s.redo();
    expect(useEditor.getState().masks).toHaveLength(1);
  });
  it("clears future when making a new edit after undo", () => {
    const s = useEditor.getState();
    s.set("exposure", 1);
    s.undo();
    s.set("contrast", 10);
    expect(useEditor.getState().future).toHaveLength(0);
  });
});
