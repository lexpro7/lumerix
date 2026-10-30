# LightDNA implementation audit

Checkpoint: 2026-10-30. Desktop stability batch; mobile development is deferred.

## Audit scope and preservation

Reviewed the existing React UI, Zustand history, Dexie schema, decoding, analysis,
color math, geometry, masks, shared rendering/export workers, AI clients/workers,
PWA configuration, tests and README. This directory has **no Git repository**:
`git status` and `git diff` cannot supply a baseline or recent commit history.
Existing source and saved user presets/palettes were preserved. No user photographs
were uploaded, persisted, or used for tests. The database migration test uses an
isolated fake IndexedDB, not the browser's user database.

Implemented means code exists and performs the operation; it does not imply every
browser/device or photographic case has been tested. Evidence and gaps follow.

## Feature inventory

| Feature | Implementation status | Evidence / outstanding work |
| --- | --- | --- |
| JPEG/PNG/WebP import | Implemented | Picker/drop, validation, decode errors, EXIF orientation request, 1440px preview, 80MB/50MP guards. Browser fixture exercises PNG; JPEG/WebP/EXIF fixture matrix remains. |
| Reference analysis | Implemented | D65 Lab mean/std, five clustered colors, luminance histogram; conversion and statistics tests. |
| Classic Color DNA | Implemented | Guarded Reinhard Lab transfer, original blend, no-reference edits; regression tests against original pipeline. |
| Perceptual Color DNA | Implemented, validation partial | Quantile tone mapping with bounded smooth displacement, separate tone/chroma controls, mask-based skin protection. Finite/monotonic tests; photographic quality evaluation remains. |
| Exposure/contrast/tonal/color controls | Implemented | Shared global pipeline for preview/export, reset and history. |
| HSL mixer | Implemented, coverage partial | Eight soft hue ranges; global pipeline/LUT. Needs individual hue-boundary and visual regression cases. |
| Color grading / curve | Implemented | Three tonal wheels and five-point curve; LUT and shared pipeline tests. Curve is piecewise linear, not a spline editor. |
| Effects | Implemented with limits | Clarity, deterministic grain, vignette; shared pipeline. Grain and blur differ at preview resolution as expected. |
| Detail | Implemented with limits | Luminance sharpening and smoothing noise reduction; no AI denoising, chroma denoise, or RAW processing. |
| Crop | Implemented, interaction validation partial | Normalized crop, ratio-guided drag, numeric inputs, 90-degree rotation, flip, straighten; geometry/alpha tests. Ratio selection constrains new drag, not existing numeric dimensions; no resize handles. |
| Before/after, zoom/pan | Implemented, interaction validation partial | Canvas comparison and draggable range, fit/zoom, pan. Comparison overlay captures image dragging; pan surrounding workspace or turn comparison off. |
| Manual masks | Implemented | Paint/erase, union/subtraction, overlay, rename/duplicate/delete, visibility/invert/feather/edge/opacity; immutable history and normalized sampling tests. Raster masks capped at 768px. |
| Local adjustments | Implemented | All nine local controls tested for changing selected pixels while preserving unselected pixels; masks applied before geometry in both preview/export. |
| Portrait / skin AI | Real model implemented; validation partial | Actual MediaPipe multiclass model ran successfully on synthetic input and reused cache. No actual portrait accuracy test yet; inference is currently on main thread. |
| Sky / semantic object AI | Real model implemented; runtime unresolved | Actual SegFormer integration, model/image cache, WebGPU with CPU fallback, bounded 512px input and timeout. Browser automation became unresponsive during actual inference; **no passing result observed**. Needs isolated CPU/GPU diagnosis. |
| Click-to-select object instance | Missing | Current object tool selects semantic classes, not arbitrary object instances. No simulated AI result. |
| AI mask refinement | Partial | Manual brush/erase, feather/edge supported; no learned edge matting. |
| LUT Studio | Implemented | Real 17/33/65 .cube grids, red-fastest ordering, domains, actual trilinear preview. Tests cover serialization/interpolation. Spatial effects, masks, crop, skin protection explicitly excluded. |
| Presets | Implemented | Built-ins, actual color thumbnails, custom save/apply/rename/delete/favorite, look strength. Dexie legacy migration tested. Thumbnails show global color, not full spatial rendering. |
| Palettes | Implemented, coverage partial | Built-ins/reference colors/custom five-color palettes, strength/application, save/rename/delete. IndexedDB CRUD tested; full UI workflow and malformed stored-data validation remain. |
| Undo/redo | Implemented | 40 immutable document snapshots, coalesced slider edits, geometry/masks/styles included; tests cover branching and separate-mask edits. Photo/reference replacement is outside document history. |
| Image export | Implemented | Original-resolution PNG/JPEG, quality/progress/cancellation, shared pipeline, JPEG white background, delayed object URL cleanup. Browser encoded dimensions/type checks passed; quantitative check recorded below. |
| Worker lifecycle | Implemented, stress validation partial | Preview debounce/cancellation/stale-result guard; workers terminate on completion/error/cancel. AI constructor/postMessage failures release busy state. Long-session profiling remains. |
| Install/offline | Implemented, runtime validation partial | Manifest/icons, service worker application cache, lazy model/runtime caches. Build generates PWA. Fresh-install/offline reload/model-cache tests not yet executed for this upgraded version. |
| Desktop UI / accessibility | Implemented, coverage partial | Five workspaces, search, history, native export dialog, keyboard shortcuts, labels and loading/error states. Desktop empty/search/advanced UI inspected; complete loaded-photo keyboard/drag test remains. |
| Session/project persistence | Partial by design | Only explicit presets/palettes persist; photographs, masks and history are memory-only. No project-file save/load. |
| Mobile | Deferred | Existing styles preserved; no further redesign or responsive validation in this stability batch. |

## Stability changes in this batch

- Bounded semantic input to 512px before class-logit postprocessing; previously
  preview-sized per-class tensors could allocate hundreds of megabytes.
- Added AI timeout, startup/postMessage failure recovery and GPU inference fallback.
- Refined tonal matching to smooth bounded interpolation; edge refinement now
  preserves empty/full mask coverage.
- Fixed zero look strength to neutralize global spatial effects as well as color.
- Avoided preparing inactive/zero-opacity/unused masks, skipped unnecessary second
  pixel passes, and moved local parameter construction out of the per-pixel loop.
- Hoisted crop transform geometry/trigonometry out of the pixel loop. Bilinear
  geometry sampling now uses premultiplied alpha to prevent invisible-color halos.
- Isolated history coalescing by edited mask IDs; validated favorite storage shape.
- Expanded regression tests and browser harness, included the harness in typecheck.

## Executed validation

- `npm run typecheck`: passed after stability changes.
- `npm test`: **42 tests passed in 3 files** after changes. Coverage includes
  color conversion/transfer, masks/all local controls, crop/alpha, tone monotonicity,
  skin protection, zero look strength, LUT math, history, legacy preset migration
  and palette persistence.
- Earlier browser harness: PNG decoding, analysis/render workers, cropped/rotated
  preview, changed pixels, full-resolution PNG/JPEG formats and dimensions, actual
  LUT export/preview all passed.
- Actual portrait runtime on synthetic fixture: passed; returned real empty
  person/skin masks as expected for that non-portrait fixture. This is a runtime
  test, **not a photographic segmentation accuracy score**.
- Semantic runtime: attempted twice, browser-control timeouts; not passed.
- Production build and expanded quantitative browser results: see final checkpoint
  addendum below.

## Limits and exact next steps

1. Diagnose semantic runtime in an isolated tab, recording WASM and WebGPU separately
   and actual elapsed time/memory. Verify on consented portrait and sky/object photos;
   do not infer accuracy from synthetic shapes. Check model download failure, retry,
   cancellation, cache reuse, and offline reuse. Move portrait inference off main thread.
2. Run loaded-photo desktop interactions end to end: file picker/drop, all workspace
   controls, crop draft/apply/cancel, brush/erase, mask stack, undo/redo, presets and
   palettes across reload, image and LUT download. Browser file upload was blocked by
   the extension's file-access permission; the generated-File harness avoids changing
   that permission but does not validate the picker interaction.
3. Expand preview/export pixel comparisons to reference transfer, all HSL sectors,
   grading/curves, feathered overlapping masks, transparent photos and noninteger
   crops. Add JPEG/WebP/EXIF fixtures. Compare blur/grain at normalized viewing scale
   with explicitly documented tolerances, not exact byte equality.
4. Test installed production PWA offline, including lazy model/runtime caching and
   an update while unsaved edits exist. No passing offline result claimed here.
5. Profile sustained editing and large exports on representative desktop hardware.
   Export still uses full RGBA buffers and float luminance planes: 50MP inputs can
   require substantial RAM; no tiled export or measured peak-memory guarantee yet.
6. Resolve residual UX gaps (crop handles/ratio semantics, full spatial thumbnails,
   palette editor and project serialization) in separate testable batches.

No mobile work should start until the desktop stability phase is accepted.
The existing VS Code launch URL uses port 8080 while Vite defaults to 5173;
use the URL printed by `npm run dev` or configure the debugger separately.
Last dependency audit reported four low-severity transitive Workbox/deepmerge
advisories, no high-severity findings; no destructive dependency downgrade applied.

## Final checkpoint results

`npm run build` passed after the stability changes (Vite 6.4.5, 1,612 modules;
PWA generated 14 precache entries, 1,450.41 KiB). AI WASM/model payloads remain lazy.

The expanded browser harness was executed in Chrome after the final processing
changes and displayed **ALL BROWSER PIPELINE CHECKS PASSED**. It verified invalid
MIME and corrupt PNG rejection, actual worker cancellation, original/preview
dimensions, crop/rotation and masked edits, PNG/JPEG encoding, LUT serialization
and LUT preview. Downsampling the actual full-resolution exports to preview size
gave mean absolute RGB error **0.090 / 255 (PNG)** and **0.623 / 255 (JPEG, quality
0.9)**, below the respective 2/255 and 4/255 limits. The fixture includes exposure,
clarity, a full-coverage local warmth mask, half-width crop and 90-degree rotation.
These measured results apply to this synthetic fixture, not all photographs.

Reproduce: `npm install`, `npm run dev`, then open
`/tests/browser/index.html` on the printed development URL and run the pipeline
button. AI buttons download and run actual models; they are separate checks.
The harness is development-only and is not an entry point in the production build.
This is a safe checkpoint with the unresolved items above explicitly deferred.
