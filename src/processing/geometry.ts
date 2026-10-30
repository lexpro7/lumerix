import type { Geometry } from "../editor/types";
import { clamp } from "./color";
export function geometryDimensions(w: number, h: number, g: Geometry) {
  const cw = Math.max(1, Math.round(w * g.width)),
    ch = Math.max(1, Math.round(h * g.height)),
    angle = ((g.rotation + g.straighten) * Math.PI) / 180,
    c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  return {
    width: Math.max(1, Math.round(cw * c + ch * s)),
    height: Math.max(1, Math.round(cw * s + ch * c)),
    cw,
    ch,
    angle,
  };
}
export function outputToSource(
  x: number,
  y: number,
  w: number,
  h: number,
  g: Geometry,
) {
  return sourceMapper(w, h, g)(x, y);
}
function sourceMapper(w: number, h: number, g: Geometry) {
  const d = geometryDimensions(w, h, g),
    c = Math.cos(d.angle),
    s = Math.sin(d.angle);
  return (x: number, y: number) => {
    const dx = x - d.width / 2,
      dy = y - d.height / 2;
    let u = c * dx + s * dy,
      v = -s * dx + c * dy;
    if (g.flipX) u = -u;
    if (g.flipY) v = -v;
    return {
      x: u + d.cw / 2 + g.x * w,
      y: v + d.ch / 2 + g.y * h,
      inside: Math.abs(u) <= d.cw / 2 && Math.abs(v) <= d.ch / 2,
    };
  };
}
export function transformGeometry(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  g: Geometry,
) {
  const { width, height } = geometryDimensions(w, h, g);
  if (
    g.x === 0 &&
    g.y === 0 &&
    g.width === 1 &&
    g.height === 1 &&
    !g.rotation &&
    !g.straighten &&
    !g.flipX &&
    !g.flipY
  )
    return { pixels: data, width: w, height: h };
  const pixels = new Uint8ClampedArray(width * height * 4);
  const map = sourceMapper(w, h, g);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = map(x + 0.5, y + 0.5);
      if (!p.inside) continue;
      const sx = clamp(p.x - 0.5, 0, w - 1),
        sy = clamp(p.y - 0.5, 0, h - 1),
        ix = Math.floor(sx),
        iy = Math.floor(sy),
        tx = sx - ix,
        ty = sy - iy;
      const indices = [
        (iy * w + ix) * 4,
        (iy * w + Math.min(ix + 1, w - 1)) * 4,
        (Math.min(iy + 1, h - 1) * w + ix) * 4,
        (Math.min(iy + 1, h - 1) * w + Math.min(ix + 1, w - 1)) * 4,
      ];
      const weights = [
        (1 - tx) * (1 - ty),
        tx * (1 - ty),
        (1 - tx) * ty,
        tx * ty,
      ];
      const alpha = indices.reduce(
        (sum, index, n) => sum + data[index + 3] * weights[n],
        0,
      );
      const dest = (y * width + x) * 4;
      pixels[dest + 3] = alpha;
      // Interpolate premultiplied colors, so invisible RGB cannot bleed into edges.
      if (alpha > 0)
        for (let k = 0; k < 3; k++)
          pixels[dest + k] =
            indices.reduce(
              (sum, index, n) =>
                sum + data[index + k] * data[index + 3] * weights[n],
              0,
            ) / alpha;
    }
  return { pixels, width, height };
}
