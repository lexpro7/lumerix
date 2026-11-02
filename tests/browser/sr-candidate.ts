// Benchmark-only adapter. General v3 is a 4x network, reduced to 2x output.
export const candidateUrl =
  "https://huggingface.co/Gaurox/frameshift-models/resolve/d31625b21475911656ba0964cb9830328bdf7476/upscale-video-onnx/realesr_general_x4v3.onnx";
export const candidateHash =
  "dbb0561758e0727c76b7bf6b539a988d3b3050d51f01dcf60c842de6e6add349";
export function packRgb(rgb: Uint8ClampedArray, width: number, height: number) {
  const plane = width * height;
  if (rgb.length !== plane * 3) throw new Error("Invalid RGB input");
  const data = new Float32Array(plane * 3);
  for (let i = 0; i < plane; i++)
    for (let c = 0; c < 3; c++) data[c * plane + i] = rgb[i * 3 + c] / 255;
  return data;
}
export function reduceOutput(
  data: Float32Array,
  dims: readonly number[],
  width: number,
  height: number,
) {
  const w = width * 4,
    h = height * 4,
    plane = w * h;
  if (
    dims.length !== 4 ||
    dims[0] !== 1 ||
    dims[1] !== 3 ||
    dims[2] !== h ||
    dims[3] !== w ||
    data.length !== plane * 3
  )
    throw new Error("Unexpected Real-ESRGAN 4x tensor dimensions");
  const out = new Uint8ClampedArray(width * 2 * height * 2 * 3);
  for (let y = 0; y < height * 2; y++)
    for (let x = 0; x < width * 2; x++)
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let j = 0; j < 2; j++)
          for (let i = 0; i < 2; i++) {
            const value = data[c * plane + (2 * y + j) * w + 2 * x + i];
            if (!Number.isFinite(value))
              throw new Error("Non-finite model output");
            sum += Math.max(0, Math.min(1, value));
          }
        out[(y * width * 2 + x) * 3 + c] = Math.round((sum / 4) * 255);
      }
  return { data: out, width: width * 2, height: height * 2, channels: 3 };
}
