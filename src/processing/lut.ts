import type { Analysis } from "./analysis";
import type { DocumentState } from "../editor/types";
import { globalTransform } from "./global";
import { clamp, type Triple } from "./color";
export const lutIncluded = [
  "Exposure, contrast, shadows, highlights, temperature, tint, saturation",
  "HSL Color Mixer, RGB tone curve, three-way color grading",
  "Color DNA (frozen source/reference statistics), palette mapping, look strength",
];
export const lutExcluded = [
  "Crop, rotation, flips, straighten",
  "Masks, local adjustments and mask-based skin protection",
  "Clarity, sharpening, noise reduction, grain, vignette",
];
export function createLut(
  doc: DocumentState,
  source: Analysis,
  reference: Analysis | null,
  size = 33,
) {
  const transform = globalTransform(doc.params, doc.style, source, reference),
    values = new Float32Array(size ** 3 * 3);
  let i = 0;
  for (let b = 0; b < size; b++)
    for (let g = 0; g < size; g++)
      for (let r = 0; r < size; r++) {
        const out = transform([
          (r / (size - 1)) * 255,
          (g / (size - 1)) * 255,
          (b / (size - 1)) * 255,
        ]);
        for (const v of out) values[i++] = clamp(v / 255);
      }
  return values;
}
export function cubeText(values: Float32Array, size: number, name: string) {
  if (![17, 33, 65].includes(size) || values.length !== size ** 3 * 3)
    throw new Error("Invalid LUT dimensions.");
  const lines = [
    `TITLE "${name.replace(/["\r\n]/g, " ").slice(0, 80)}"`,
    "# Lumerix: global sRGB input and output; red varies fastest.",
    `LUT_3D_SIZE ${size}`,
    "DOMAIN_MIN 0.0 0.0 0.0",
    "DOMAIN_MAX 1.0 1.0 1.0",
  ];
  for (let i = 0; i < values.length; i += 3)
    lines.push(
      [values[i], values[i + 1], values[i + 2]]
        .map((v) => clamp(v).toFixed(7))
        .join(" "),
    );
  return lines.join("\n") + "\n";
}
export function sampleLut(
  values: Float32Array,
  size: number,
  rgb: Triple,
): Triple {
  const pos = rgb.map((v) => clamp(v / 255) * (size - 1)),
    lo = pos.map(Math.floor),
    f = pos.map((v, i) => v - lo[i]),
    out: Triple = [0, 0, 0];
  for (let b = 0; b < 2; b++)
    for (let g = 0; g < 2; g++)
      for (let r = 0; r < 2; r++) {
        const index =
            ((Math.min(size - 1, lo[2] + b) * size +
              Math.min(size - 1, lo[1] + g)) *
              size +
              Math.min(size - 1, lo[0] + r)) *
            3,
          weight =
            (r ? f[0] : 1 - f[0]) *
            (g ? f[1] : 1 - f[1]) *
            (b ? f[2] : 1 - f[2]);
        for (let c = 0; c < 3; c++) out[c] += values[index + c] * weight * 255;
      }
  return out;
}
