import type { Analysis } from "./analysis";
import { adjust, defaults } from "./adjustments";
import { clamp, type Triple } from "./color";
import { globalTransform } from "./global";
import { blurPlane, prepareMask, sampleMask } from "./masks";
import { transformGeometry } from "./geometry";
import type { DocumentState } from "../editor/types";
export function renderPixels(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  doc: DocumentState,
  source: Analysis,
  ref: Analysis | null,
  progress?: (v: number) => void,
) {
  const global = globalTransform(doc.params, doc.style, source, ref),
    out = new Uint8ClampedArray(input.length);
  const masks = doc.masks
    .filter(
      (m) =>
        m.enabled &&
        m.opacity > 0 &&
        (Object.values(m.adjustments).some(Boolean) ||
          (doc.style.skinProtection > 0 && m.id === doc.style.skinMaskId)),
    )
    .map((m) => ({
      ...m,
      prepared: prepareMask(m),
      params: { ...defaults, ...m.adjustments, strength: 0 },
    }));
  const skin = masks.find((m) => m.id === doc.style.skinMaskId);
  const localMasks = masks.filter((m) =>
    Object.values(m.adjustments).some(Boolean),
  );
  const lookStrength = doc.style.lookStrength / 100;
  for (let i = 0; i < input.length; i += 4) {
    const x = (((i / 4) % width) + 0.5) / width,
      y = (Math.floor(i / 4 / width) + 0.5) / height,
      weight = skin
        ? (sampleMask(skin.prepared, skin.width, skin.height, x, y) *
            skin.opacity) /
          100
        : 0;
    const rgb = global([input[i], input[i + 1], input[i + 2]], weight);
    out[i] = rgb[0];
    out[i + 1] = rgb[1];
    out[i + 2] = rgb[2];
    out[i + 3] = input[i + 3];
    if (i % 262144 === 0) progress?.((i / input.length) * 0.45);
  }
  const spatial =
    (lookStrength &&
      (doc.params.clarity || doc.params.sharpness || doc.params.noise)) ||
    localMasks.some((m) => m.adjustments.clarity || m.adjustments.sharpness);
  let small: Float32Array | undefined,
    wide: Float32Array | undefined,
    lum: Float32Array | undefined;
  if (spatial) {
    lum = new Float32Array(width * height);
    for (let i = 0; i < lum.length; i++)
      lum[i] =
        out[i * 4] * 0.2126 + out[i * 4 + 1] * 0.7152 + out[i * 4 + 2] * 0.0722;
    small = blurPlane(
      lum,
      width,
      height,
      Math.max(1, Math.min(width, height) / 1000),
    );
    wide = blurPlane(
      lum,
      width,
      height,
      Math.max(2, Math.min(width, height) / 80),
    );
  }
  if (
    !spatial &&
    !(doc.params.vignette * lookStrength) &&
    !(doc.params.grain * lookStrength) &&
    !localMasks.length
  ) {
    progress?.(1);
    return transformGeometry(out, width, height, doc.geometry);
  }
  for (let i = 0; i < out.length; i += 4) {
    const j = i / 4,
      x = ((j % width) + 0.5) / width,
      y = (Math.floor(j / width) + 0.5) / height;
    let rgb: Triple = [out[i], out[i + 1], out[i + 2]];
    const detail = (clarity: number, sharpness: number, noise = 0) =>
      lum
        ? (lum[j] - wide![j]) * clarity * 0.015 +
          (lum[j] - small![j]) * sharpness * 0.02 +
          (small![j] - lum[j]) * noise * 0.01
        : 0;
    const delta = detail(
      doc.params.clarity * lookStrength,
      doc.params.sharpness * lookStrength,
      doc.params.noise * lookStrength,
    );
    rgb = rgb.map((v) => clamp((v + delta) / 255) * 255) as Triple;
    for (const m of localMasks) {
      const a =
        (sampleMask(m.prepared, m.width, m.height, x, y) * m.opacity) / 100;
      if (a < 0.0001) continue;
      const local = adjust(rgb, m.params),
        d = detail(m.adjustments.clarity, m.adjustments.sharpness);
      rgb = rgb.map(
        (v, c) => clamp((v + (local[c] + d - v) * a) / 255) * 255,
      ) as Triple;
    }
    const distance = Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 1.414),
      shade =
        1 - (doc.params.vignette / 100) * lookStrength * distance ** 2 * 0.8;
    const seed =
        Math.sin(
          Math.floor(x * 4096) * 12.9898 + Math.floor(y * 4096) * 78.233,
        ) * 43758.5453,
      grain =
        (seed - Math.floor(seed) - 0.5) *
        doc.params.grain *
        lookStrength *
        0.35;
    for (let c = 0; c < 3; c++)
      out[i + c] = clamp((rgb[c] * shade + grain) / 255) * 255;
    if (i % 262144 === 0) progress?.(0.45 + (i / out.length) * 0.45);
  }
  const transformed = transformGeometry(out, width, height, doc.geometry);
  progress?.(1);
  return transformed;
}
