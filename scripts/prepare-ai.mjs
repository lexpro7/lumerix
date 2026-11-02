import { mkdir, copyFile, readdir } from "node:fs/promises";
const source = new URL(
  "../node_modules/@mediapipe/tasks-vision/wasm/",
  import.meta.url,
);
const dest = new URL("../public/ai/mediapipe/", import.meta.url);
await mkdir(dest, { recursive: true });
for (const name of await readdir(source))
  if (name.endsWith(".wasm") || name.endsWith(".js"))
    await copyFile(new URL(name, source), new URL(name, dest));
await copyFile(
  new URL(
    "../node_modules/@mediapipe/tasks-vision/vision_bundle.js",
    import.meta.url,
  ),
  new URL("vision_bundle.js", dest),
);
await copyFile(
  new URL("../src/ai/portrait.worker.js", import.meta.url),
  new URL("../public/ai/portrait.worker.js", import.meta.url),
);
