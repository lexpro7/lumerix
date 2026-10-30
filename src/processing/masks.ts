import { clamp } from "./color";
import { localDefaults, type Mask } from "../editor/types";
export function makeMask(
  width: number,
  height: number,
  name = "Brush mask",
  kind: Mask["kind"] = "manual",
): Mask {
  const scale = Math.min(1, 768 / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  return {
    id: crypto.randomUUID(),
    name,
    kind,
    width,
    height,
    data: new Uint8ClampedArray(width * height),
    enabled: true,
    invert: false,
    feather: 2,
    edge: 0,
    opacity: 100,
    adjustments: { ...localDefaults },
  };
}
// Coordinates are normalized to the original, orientation-corrected image.
export function paintMask(
  mask: Mask,
  points: { x: number; y: number }[],
  radius: number,
  erase = false,
): Uint8ClampedArray {
  const data = mask.data.slice(),
    r = Math.max(1, radius * Math.min(mask.width, mask.height));
  for (const p of points) {
    const cx = p.x * mask.width,
      cy = p.y * mask.height;
    for (
      let y = Math.max(0, Math.floor(cy - r));
      y < Math.min(mask.height, Math.ceil(cy + r));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(cx - r));
        x < Math.min(mask.width, Math.ceil(cx + r));
        x++
      ) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d > 1) continue;
        const a = clamp((1 - d) * 5),
          i = y * mask.width + x;
        data[i] = erase ? data[i] * (1 - a) : Math.max(data[i], 255 * a);
      }
  }
  return data;
}
export function strokePoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  radius: number,
) {
  const n = Math.max(
    1,
    Math.ceil(
      Math.hypot(b.x - a.x, b.y - a.y) / Math.max(0.001, radius * 0.25),
    ),
  );
  return Array.from({ length: n }, (_, i) => ({
    x: a.x + ((b.x - a.x) * (i + 1)) / n,
    y: a.y + ((b.y - a.y) * (i + 1)) / n,
  }));
}
export function combineMasks(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  operation: "add" | "subtract",
) {
  return a.map((v, i) =>
    operation === "add" ? Math.max(v, b[i] ?? 0) : Math.max(0, v - (b[i] ?? 0)),
  );
}
export function sampleMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const fx = clamp(x * width - 0.5, 0, width - 1),
    fy = clamp(y * height - 0.5, 0, height - 1),
    ix = Math.floor(fx),
    iy = Math.floor(fy),
    tx = fx - ix,
    ty = fy - iy;
  const a = data[iy * width + ix],
    b = data[iy * width + Math.min(ix + 1, width - 1)],
    c = data[Math.min(iy + 1, height - 1) * width + ix],
    d =
      data[Math.min(iy + 1, height - 1) * width + Math.min(ix + 1, width - 1)];
  return (
    ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) / 255
  );
}
export function blurPlane(
  input: Float32Array,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.round(radius));
  if (!r) return input;
  const tmp = new Float32Array(input.length),
    out = new Float32Array(input.length);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++)
      sum += input[y * width + clamp(x, 0, width - 1)];
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = sum / (2 * r + 1);
      sum +=
        input[y * width + clamp(x + r + 1, 0, width - 1)] -
        input[y * width + clamp(x - r, 0, width - 1)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++)
      sum += tmp[clamp(y, 0, height - 1) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / (2 * r + 1);
      sum +=
        tmp[clamp(y + r + 1, 0, height - 1) * width + x] -
        tmp[clamp(y - r, 0, height - 1) * width + x];
    }
  }
  return out;
}
export function prepareMask(mask: Mask) {
  const blurred = blurPlane(
    Float32Array.from(mask.data),
    mask.width,
    mask.height,
    (mask.feather / 100) * Math.min(mask.width, mask.height) * 0.15,
  );
  return Uint8ClampedArray.from(blurred, (v) => {
    const coverage = v / 255;
    const shifted = clamp(
      coverage + (mask.edge / 100) * 2 * coverage * (1 - coverage),
    );
    return (mask.invert ? 1 - shifted : shifted) * 255;
  });
}
