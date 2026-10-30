import { adjust, defaults, type Params } from "./adjustments";
import { clamp, rgbToLab, labToRgb, type Triple } from "./color";
import { transferLab } from "./transfer";
import type { Analysis } from "./analysis";
import type { Style } from "../editor/types";
export function rgbToHsl(rgb: Triple): Triple {
  const [r, g, b] = rgb.map((v) => v / 255),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (d)
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
}
export function hslToRgb([h, s, l]: Triple): Triple {
  const a = s * Math.min(l, 1 - l),
    f = (n: number) => {
      const k = (n + h / 30) % 12;
      return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
  return [f(0), f(8), f(4)];
}
export function curveValue(x: number, curve: number[]) {
  const u = clamp(x) * 4,
    i = Math.min(3, Math.floor(u)),
    t = u - i;
  return clamp(curve[i] * (1 - t) + curve[i + 1] * t);
}
function percentile(hist: number[], q: number) {
  const total = hist.reduce((a, b) => a + b, 0);
  if (!total) return q * 100;
  let sum = 0;
  for (let i = 0; i < hist.length; i++) {
    if (sum + hist[i] >= q * total && hist[i] > 0)
      return ((i + (q * total - sum) / hist[i]) / hist.length) * 100;
    sum += hist[i];
  }
  return 100;
}
export function toneAnchors(source: Analysis, ref: Analysis) {
  const qs = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1];
  const points = qs.map((q, i) => ({
    x: i === 0 ? 0 : i === 6 ? 100 : percentile(source.histogram, q),
    y: i === 0 ? 0 : i === 6 ? 100 : percentile(ref.histogram, q),
    slope: 0,
  }));
  const slopes = points
    .slice(1)
    .map((p, i) => (p.y - points[i].y) / Math.max(0.001, p.x - points[i].x));
  points.forEach((p, i) => {
    p.slope =
      i === 0
        ? slopes[0]
        : i === points.length - 1
          ? slopes.at(-1)!
          : slopes[i - 1] * slopes[i] <= 0
            ? 0
            : 2 / (1 / slopes[i - 1] + 1 / slopes[i]);
  });
  return points;
}
export function matchTone(l: number, anchors: ReturnType<typeof toneAnchors>) {
  let i = 0;
  while (i < anchors.length - 2 && l > anchors[i + 1].x) i++;
  const a = anchors[i],
    b = anchors[i + 1],
    dx = Math.max(0.001, b.x - a.x),
    t = clamp((l - a.x) / dx),
    mapped =
      (2 * t ** 3 - 3 * t * t + 1) * a.y +
      (t ** 3 - 2 * t * t + t) * dx * a.slope +
      (-2 * t ** 3 + 3 * t * t) * b.y +
      (t ** 3 - t * t) * dx * b.slope;
  return clamp(l + 22 * Math.tanh((mapped - l) / 22), 0, 100);
}
export function globalTransform(
  params: Params,
  style: Style,
  source: Analysis,
  ref: Analysis | null,
) {
  const p = { ...defaults, ...params };
  const anchors = ref ? toneAnchors(source, ref) : null;
  const palette = style.palette
    .map((hex) =>
      rgbToLab(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ),
    )
    .sort((a, b) => a[0] - b[0]);
  const mixActive = style.mixer.some(
      (m) => m.hue || m.saturation || m.lightness,
    ),
    curveActive = style.curve.some((v, i) => v !== i / 4),
    gradeActive = style.grading.some((g) => g.amount);
  return (original: Triple, skin = 0): Triple => {
    let rgb = [...original] as Triple;
    if (ref && p.strength) {
      const lab = rgbToLab(...rgb),
        mapped = transferLab(lab, source, ref),
        protect = 1 - (skin * style.skinProtection) / 100,
        s = clamp(p.strength / 100) * protect;
      if (style.method === "perceptual") {
        mapped[0] =
          lab[0] +
          ((matchTone(lab[0], anchors!) - lab[0]) * style.toneStrength) / 100;
        for (let c = 1; c < 3; c++)
          mapped[c] =
            lab[c] +
            (clamp(mapped[c] - lab[c], -40, 40) * style.chromaStrength) / 100;
        const chroma = Math.hypot(mapped[1], mapped[2]);
        if (chroma > 95) {
          mapped[1] *= 95 / chroma;
          mapped[2] *= 95 / chroma;
        }
      }
      const converted = labToRgb(...mapped);
      rgb = rgb.map((v, c) => v + (converted[c] - v) * s) as Triple;
    }
    rgb = adjust(rgb, p);
    if (mixActive) {
      const hsl = rgbToHsl(rgb),
        centers = [0, 30, 60, 120, 180, 240, 270, 315];
      let dh = 0,
        ds = 0,
        dl = 0,
        total = 0;
      style.mixer.forEach((m, i) => {
        const d = Math.abs(((hsl[0] - centers[i] + 540) % 360) - 180),
          weight = Math.max(0, 1 - d / 45);
        dh += m.hue * weight;
        ds += m.saturation * weight;
        dl += m.lightness * weight;
        total += weight;
      });
      if (total) {
        hsl[0] = (hsl[0] + dh / total + 360) % 360;
        hsl[1] = clamp(hsl[1] * (1 + ds / total / 100));
        hsl[2] = clamp(hsl[2] + dl / total / 200);
        rgb = hslToRgb(hsl);
      }
    }
    if (curveActive)
      rgb = rgb.map((v) => curveValue(v / 255, style.curve) * 255) as Triple;
    if (gradeActive || (palette.length && style.paletteStrength)) {
      const lab = rgbToLab(...rgb),
        l = clamp(lab[0] / 100);
      if (gradeActive) {
        const weights = [(1 - l) ** 2, 4 * l * (1 - l), l * l];
        style.grading.forEach((g, i) => {
          lab[1] +=
            Math.cos((g.hue * Math.PI) / 180) * g.amount * 0.3 * weights[i];
          lab[2] +=
            Math.sin((g.hue * Math.PI) / 180) * g.amount * 0.3 * weights[i];
        });
      }
      if (palette.length && style.paletteStrength) {
        const v = l * (palette.length - 1),
          i = Math.floor(v),
          a = palette[i],
          b = palette[Math.min(palette.length - 1, i + 1)],
          t = v - i,
          s = style.paletteStrength / 100;
        lab[1] += (a[1] * (1 - t) + b[1] * t - lab[1]) * s;
        lab[2] += (a[2] * (1 - t) + b[2] * t - lab[2]) * s;
      }
      rgb = labToRgb(...lab);
    }
    return rgb.map(
      (v, c) =>
        clamp(
          (original[c] + ((v - original[c]) * style.lookStrength) / 100) / 255,
        ) * 255,
    ) as Triple;
  };
}
