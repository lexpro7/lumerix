import { clamp, encode, linearize, type Triple } from "./color";
export interface Params {
  strength: number;
  exposure: number;
  contrast: number;
  saturation: number;
  warmth: number;
  shadows: number;
  highlights: number;
  tint: number;
  clarity: number;
  sharpness: number;
  noise: number;
  grain: number;
  vignette: number;
}
export const defaults: Params = {
  strength: 70,
  exposure: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  shadows: 0,
  highlights: 0,
  tint: 0,
  clarity: 0,
  sharpness: 0,
  noise: 0,
  grain: 0,
  vignette: 0,
};
export function adjust(rgb: Triple, p: Params): Triple {
  if (
    !p.exposure &&
    !p.contrast &&
    !p.saturation &&
    !p.warmth &&
    !p.shadows &&
    !p.highlights &&
    !p.tint
  )
    return rgb;
  let v = rgb.map((x) => linearize(x / 255) * 2 ** p.exposure);
  const lum = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  const tonal =
    ((p.shadows / 100) * (1 - clamp(lum)) ** 3 +
      (p.highlights / 100) * clamp(lum) ** 2) *
    0.35;
  v = v.map((x) => encode(Math.max(0, x + tonal)));
  v[0] += (p.warmth / 100) * 0.075;
  v[2] -= (p.warmth / 100) * 0.075;
  v[1] -= ((p.tint || 0) / 100) * 0.06;
  v = v.map((x) => (x - 0.5) * (1 + p.contrast / 100) + 0.5);
  const gray = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  return v.map(
    (x) => clamp(gray + (x - gray) * (1 + p.saturation / 100)) * 255,
  ) as Triple;
}
