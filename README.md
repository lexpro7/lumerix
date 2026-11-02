# Lumerix Studio

An offline-first, on-device photo editor built by extending the existing photo editing PWA. React, TypeScript, Vite, Tailwind, Lucide, Zustand and Dexie remain in place. Existing v1 custom presets migrate without deletion, and the original Reinhard Lab transfer remains available as **Classic**.

## Launch and validate

The new Enhance workspace supports Fast and AI 2x upscaling. See
[ENHANCE.md](ENHANCE.md) for usage, memory limits and current verification gaps.

Current audit, executed test results, limitations and next steps:
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Mobile development is deferred
until the desktop stability phase is complete.

Node.js 22.12+ (Node 24 recommended):

```sh
npm install
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`predev` / `prebuild` copy the installed MediaPipe runtime to `public/ai/mediapipe`. These generated files are ignored by Git. Deploy the complete `dist/` folder on HTTPS (or use localhost). There is no backend or API key.

## Five workspaces

- **Edit:** Light and Color first; Advanced reveals the HSL Color Mixer, three-way Color Grading, Effects, Detail and an RGB tone curve. Groups expand independently. Each slider and group has a reset. Search finds editing tools.
- **AI Tools:** real on-device sky/semantic-class selection, portrait person/skin segmentation, plus manual Brush and Erase. Add/subtract detected selections, rename, duplicate, disable, delete, invert, feather, refine edges, and adjust mask opacity. Exposure, contrast, highlights, shadows, temperature, tint, saturation, clarity and sharpness work locally. Masks remain editable after Done.
- **Color DNA:** reference palette and luminance histogram, Classic Lab transfer or Perceptual tone/chroma matching. Skin protection uses an explicitly selected mask rather than a skin-color guess.
- **Looks:** six built-in parameter looks, custom presets, favorites, adjustable look strength, built-in palettes and editable custom color collections. Thumbnails evaluate the global color transformation. Presets save parameters; palettes guide color; LUTs encode a portable global RGB transform.
- **Crop:** drag a crop rectangle or enter percentages; aspect ratios, quarter-turn rotation, flip, and straighten. Done commits geometry as one undoable operation. Straightening expands the canvas, preserving the cropped content; PNG keeps transparent corners and JPEG uses white.

Mobile uses bottom workspace navigation and a dismissible tool drawer. Before/After, Undo/Redo and Export stay at the top. Selection editing uses original framing so strokes and segmentation remain in the original image coordinate system. Done returns to the cropped/transformed view.

Shortcuts: **Ctrl/Cmd Z** undo, **Ctrl/Cmd Shift Z** or **Ctrl/Cmd Y** redo, **B** comparison, **F** fit, **Escape** leave a selection/drawer, **?** history. Keyboard shortcuts do not intercept editable inputs. Sliders and comparison support arrow keys. Crop percentages provide a keyboard alternative to dragging.

## Real AI, downloads and privacy

Sky and semantic objects use [Xenova/segformer-b0-finetuned-ade-512-512](https://huggingface.co/Xenova/segformer-b0-finetuned-ade-512-512) through Transformers.js / ONNX Runtime in a dedicated worker. WebGPU is attempted, with WASM CPU fallback. The approximately 15 MB float model and approximately 22 MB inference runtime download on first use. Model and runtime data are cached; repeat analysis of the same image reuses the result.

Person and Skin use Google's [MediaPipe multi-class selfie segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter). Skin is the union of face-skin and body-skin classes, not the person silhouette. The approximately 16 MB model is explicitly cached. CPU inference avoids known cross-device GPU category differences. This small portrait inference currently runs on the main thread after yielding for UI feedback; it can briefly pause the UI. The runtime is reused and can be released on cancellation.

Object selection lists **genuine detected semantic classes**. It selects all regions with a chosen label. Individual-instance click-to-select is deliberately not implemented because this semantic model does not support it. Use Brush/Erase to isolate or correct an object. Portrait segmentation is trained for people/selfies, not guaranteed for every scene or skin appearance. Always inspect masks and correct manually.

First use needs a connection to download public model assets from Hugging Face / Google. Only asset requests leave the device; input images are not sent to these hosts. Offline AI requires a completed initial download and retained browser caches. Storage eviction, private mode, blocked model hosts or unsupported browser features produce errors with a manual-brush alternative. App assets are precached; large AI runtimes are cached lazily. No photos are stored in service-worker caches.

## Processing and geometry

- `processing/color.ts`, `analysis.ts`, `transfer.ts`: preserved D65 sRGB/Lab conversions, Welford mean/std, representative palette, histogram, guarded classic transfer.
- `processing/global.ts`: a single global RGB transform shared by editor and LUT generation. Perceptual matching uses luminance quantiles, a monotone interpolant, anchored endpoints and smooth bounded luminance changes. Chroma changes are limited. HSL, RGB curve, tonal color grading and Lab palette mapping are pointwise operations.
- `processing/masks.ts`: immutable normalized brush strokes, add/subtract, soft-edge refinement, feathering and bilinear resampling. Selection rasters have a maximum long edge of 768 pixels. This bounds history memory but limits extremely fine hair/edge precision at very high export resolutions.
- `processing/pipeline.ts`: global color, local mask effects and spatial edits before geometry. Mask coverage is sampled in the uncropped target coordinates at every output resolution. Clarity/sharpness use luminance detail; noise smoothing is a lightweight luminance filter, not AI denoising. Grain is deterministic.
- `processing/geometry.ts`: normalized crop, flips and inverse-mapped rotation. Preview and export share the same transforms. Preview uses a maximum 1,440-pixel representation; export decodes the original file.
- `processing/client.ts`, `worker.ts`, `editor/usePreview.ts`: cancellable worker jobs with stale-result protection. Preview slider jobs are debounced; exports report progress and can be cancelled.
- `store.ts`: immutable document snapshots with bounded (40-step) undo/redo and coalesced slider gestures; Dexie v2 adds palettes while preserving v1 presets.

Photos, masks and edit history are session-only and clear on reload/New session. Only explicitly saved presets/palettes and favorite settings persist. Original files are never changed. Export a photograph or LUT before closing the session. This checkout had no persistent photo-document format to migrate.

## LUT Studio

Export **17³, 33³ or 65³** standard `.cube` LUTs. Values use sRGB input/output, explicit 0–1 domains, seven decimal places, and red-fastest RGB ordering. The dialog shows a preview produced by trilinearly sampling the generated LUT on the original image.

Included: global exposure/contrast/tonal/color adjustments, HSL, RGB curve, three-way grading, frozen Color DNA statistics, palette mapping and global look strength.

Explicitly excluded: crop/rotation/flips, masks and local edits, mask-based skin protection, clarity, sharpness, noise smoothing, grain and vignette. Ordinary PNG/JPEG export includes these effects. LUTs approximate nonlinear color edits; a finer grid reduces interpolation differences. They do not perform scene-dependent relighting or re-analyze a new photograph.

## Validation

`npm test` covers color conversion, transfer compatibility, brush/erase/union/subtraction, feather/invert, normalized mask sampling, crop/flip/rotation/straightening, tonal mapping, skin protection, local-effect boundaries, transformed mask alignment, preview/export color consistency, LUT serialization/ordering/interpolation/exclusions, history, and v1 IndexedDB migration/palette persistence.

For actual browser integration, run `npm run dev`, then open `/tests/browser/index.html`. This development-only page generates a synthetic PNG and calls the real decoder, workers, PNG/JPEG encoders, LUT generator and optional real AI model loaders. It is not included in `dist/`. A synthetic inference check verifies runtime integration, not segmentation accuracy on real photographs.

The browser file-picker automation extension may need its “Allow access to file URLs” setting for automated uploads. This is a test-tool permission, not an application requirement; ordinary file selection does not need an extension.

## Limits and remaining release checks

- SDR sRGB editing only: no RAW/HDR pipeline, ICC soft-proofing or metadata preservation.
- Up to 80 MB / 50 megapixels; full-resolution spatial processing can still exceed memory on low-end devices. Reduce image dimensions if export fails. Preview and original-resolution spatial detail can differ due to resampling.
- No instance-specific click segmentation; semantic class selection and manual corrections are available.
- Portrait inference is not yet moved to a worker. Semantic inference and expensive photo processing are worker-based.
- No persistent photo project files, cloud sync or photo autosave.
- Real-scene segmentation accuracy and low-memory/mobile GPU compatibility require a broader device/photo test matrix than the synthetic integration checks.
- The dependency audit currently reports four low-severity findings in the existing Workbox/rollup `deepmerge` build-tool chain. The high-severity transitive `sharp` issue is patched via an override; `sharp` is not part of the browser image pipeline. No force downgrade of PWA support was applied.

## Branding assets

The transparent aperture vector is `public/icon.svg`. Regenerate favicon, PWA and Apple touch PNGs with `node scripts/generate-brand-icons.mjs`. The maskable icon uses a separate opaque background and safe padding. Legacy storage/cache identifiers are intentionally preserved to retain user data.
