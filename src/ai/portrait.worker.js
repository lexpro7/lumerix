/* Classic worker: MediaPipe loads its WASM glue with importScripts. */
importScripts("./mediapipe/vision_bundle.js");
let model = null,
  cachedId = "",
  cachedResult = [],
  busy = false,
  backend = "";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";
async function modelBytes() {
  let cache;
  try {
    cache = await caches.open("lightdna-ai-models-v1");
  } catch {}
  let response = cache && (await cache.match(MODEL));
  if (!response) {
    response = await fetch(MODEL);
    if (!response.ok)
      throw new Error(`Portrait download failed (${response.status})`);
    if (cache)
      try {
        await cache.put(MODEL, response.clone());
      } catch {}
  }
  return new Uint8Array(await response.arrayBuffer());
}
self.onmessage = async ({ data: m }) => {
  const send = (payload) => self.postMessage({ id: m.id, ...payload });
  if (busy) {
    send({ error: "Selection is already running" });
    return;
  }
  busy = true;
  let canvas, result;
  try {
    const requested = m.backend === "webgpu" ? "GPU" : "CPU";
    if (backend !== requested) {
      if (model)
        try {
          (await model).close();
        } catch {}
      model = null;
      cachedId = "";
      cachedResult = [];
      backend = requested;
    }
    if (cachedId === m.imageId) {
      send({ result: cachedResult });
      return;
    }
    send({ status: `Loading portrait model (${backend})...` });
    if (!model)
      model = (async () => {
        const files = await Vision.FilesetResolver.forVisionTasks(
          new URL("./mediapipe", self.location.href).href,
        );
        return Vision.ImageSegmenter.createFromOptions(files, {
          baseOptions: {
            modelAssetBuffer: await modelBytes(),
            delegate: backend,
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
          canvas: new OffscreenCanvas(1, 1),
        });
      })().catch((error) => {
        model = null;
        throw error;
      });
    const segmenter = await model;
    // Bound raster allocations; the editor resamples normalized source coordinates.
    const scale = Math.min(1, 768 / Math.max(m.width, m.height));
    const source = new OffscreenCanvas(m.width, m.height);
    source
      .getContext("2d")
      .putImageData(new ImageData(m.pixels, m.width, m.height), 0, 0);
    canvas = new OffscreenCanvas(
      Math.max(1, Math.round(m.width * scale)),
      Math.max(1, Math.round(m.height * scale)),
    );
    canvas
      .getContext("2d")
      .drawImage(source, 0, 0, canvas.width, canvas.height);
    source.width = source.height = 1;
    m.pixels = null;
    send({ status: `Finding person and skin regions (${backend})...` });
    result = segmenter.segment(canvas);
    const mask = result.categoryMask;
    if (!mask) throw new Error("Portrait model returned no mask");
    const labels = mask.getAsUint8Array(),
      skin = new Uint8ClampedArray(labels.length),
      person = new Uint8ClampedArray(labels.length);
    for (let i = 0; i < labels.length; i++) {
      skin[i] = labels[i] === 2 || labels[i] === 3 ? 255 : 0;
      person[i] = labels[i] > 0 ? 255 : 0;
    }
    cachedResult = [
      { label: "skin", width: mask.width, height: mask.height, data: skin },
      { label: "person", width: mask.width, height: mask.height, data: person },
    ];
    cachedId = m.imageId;
    send({ result: cachedResult, backend });
  } catch (error) {
    send({
      error:
        error instanceof Error ? error.message : "Portrait selection failed",
    });
  } finally {
    result?.close();
    if (canvas) canvas.width = canvas.height = 1;
    busy = false;
  }
};
