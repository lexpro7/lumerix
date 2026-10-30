import { clamp, rgbToLab, labToRgb, type Triple } from "./color";
import type { Analysis } from "./analysis";
import { adjust, type Params } from "./adjustments";
export function transferLab(
  lab: Triple,
  source: Analysis,
  ref: Analysis,
): Triple {
  return lab.map((v, c) => {
    const scale =
      source.std[c] < 0.001 ? 1 : Math.min(8, ref.std[c] / source.std[c]);
    const value = (v - source.mean[c]) * scale + ref.mean[c];
    return Number.isFinite(value) ? value : v;
  }) as Triple;
}
export function processPixels(
  data: Uint8ClampedArray,
  source: Analysis,
  ref: Analysis | null,
  p: Params,
  progress?: (v: number) => void,
) {
  const out = new Uint8ClampedArray(data.length);
  const strength = clamp(p.strength / 100);
  for (let i = 0; i < data.length; i += 4) {
    let rgb: Triple = [data[i], data[i + 1], data[i + 2]];
    if (ref && strength > 0) {
      const mapped = labToRgb(...transferLab(rgbToLab(...rgb), source, ref));
      rgb = rgb.map((v, c) => v + (mapped[c] - v) * strength) as Triple;
    }
    rgb = adjust(rgb, p);
    out[i] = rgb[0];
    out[i + 1] = rgb[1];
    out[i + 2] = rgb[2];
    out[i + 3] = data[i + 3];
    if (i % 262144 === 0) progress?.(i / data.length);
  }
  progress?.(1);
  return out;
}
