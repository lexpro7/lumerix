import { rgbToLab, labToRgb, type Triple } from "./color";
export interface Analysis {
  mean: Triple;
  std: Triple;
  palette: string[];
  histogram: number[];
}
export function analyze(data: Uint8ClampedArray): Analysis {
  const mean: Triple = [0, 0, 0],
    m2: Triple = [0, 0, 0],
    histogram = Array(32).fill(0);
  let n = 0;
  const samples: Triple[] = [];
  const stride = Math.max(1, Math.ceil(data.length / 4 / 40000));
  for (let i = 0; i < data.length; i += 4 * stride) {
    if (data[i + 3] < 128) continue;
    const lab = rgbToLab(data[i], data[i + 1], data[i + 2]);
    n++;
    samples.push(lab);
    for (let c = 0; c < 3; c++) {
      const delta = lab[c] - mean[c];
      mean[c] += delta / n;
      m2[c] += delta * (lab[c] - mean[c]);
    }
    histogram[Math.min(31, Math.max(0, Math.floor((lab[0] / 100) * 32)))]++;
  }
  samples.sort((a, b) => a[0] - b[0]);
  let centers: Triple[] = Array.from(
    { length: 5 },
    (_, i) =>
      [
        ...(samples[Math.floor(((samples.length - 1) * (i + 0.5)) / 5)] ?? [
          0, 0, 0,
        ]),
      ] as Triple,
  );
  for (let pass = 0; pass < 8; pass++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of samples) {
      let k = 0,
        dist = Infinity;
      centers.forEach((q, j) => {
        const d = p.reduce((s, v, c) => s + (v - q[c]) ** 2, 0);
        if (d < dist) {
          dist = d;
          k = j;
        }
      });
      for (let c = 0; c < 3; c++) sums[k][c] += p[c];
      sums[k][3]++;
    }
    centers = centers.map((p, j) =>
      sums[j][3]
        ? (sums[j].slice(0, 3).map((v) => v / sums[j][3]) as Triple)
        : p,
    );
  }
  return {
    mean,
    std: m2.map((v) => Math.sqrt(v / Math.max(1, n))) as Triple,
    histogram,
    palette: centers
      .sort((a, b) => a[0] - b[0])
      .map(
        (p) =>
          "#" +
          labToRgb(...p)
            .map((v) => Math.round(v).toString(16).padStart(2, "0"))
            .join(""),
      ),
  };
}
