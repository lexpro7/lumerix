export type Triple = [number, number, number];
export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
export const linearize = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
export const encode = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
const f = (v: number) =>
  v > 216 / 24389 ? Math.cbrt(v) : ((24389 / 27) * v + 16) / 116;
const inv = (v: number) =>
  v ** 3 > 216 / 24389 ? v ** 3 : (116 * v - 16) / (24389 / 27);
// sRGB ↔ CIE Lab, D65 reference white. Inputs and outputs are RGB in 0…255.
export function rgbToLab(r: number, g: number, b: number): Triple {
  r = linearize(r / 255);
  g = linearize(g / 255);
  b = linearize(b / 255);
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047),
    y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b),
    z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function labToRgb(l: number, a: number, b: number): Triple {
  const y = (l + 16) / 116,
    x = 0.95047 * inv(y + a / 500),
    yy = inv(y),
    z = 1.08883 * inv(y - b / 200);
  return [
    clamp(encode(3.2404542 * x - 1.5371385 * yy - 0.4985314 * z)) * 255,
    clamp(encode(-0.969266 * x + 1.8760108 * yy + 0.041556 * z)) * 255,
    clamp(encode(0.0556434 * x - 0.2040259 * yy + 1.0572252 * z)) * 255,
  ];
}
