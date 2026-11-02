# Enhance: 2x upscaling

Choose Enhance, select a mode, then Apply 2x. The full original-resolution photo
is edited, cropped and upscaled in a cancellable worker. The main workspace shows
the result with Original / Upscaled comparison at identical visual scale; Original
means the edited photograph immediately before upscaling. Use 100% or 200% to
inspect output pixels. There is no separate sample preview.

Fast uses alpha-aware Catmull-Rom bicubic resampling without added sharpening.
AI runs Swin2SR lightweight x2 fp32 via Transformers.js, preferably WebGPU with a
fresh-worker CPU fallback. The official processor rescales RGB bytes by 1/255;
the pipeline clamps reconstructed floats and converts them back to RGB bytes.
There is no additional normalization or channel swap. AI uses 128px cores and
32px context halos, discards model padding, and rejects transparent inputs rather
than incorrectly unpremultiplying nonlinear neural output. Use Fast for alpha.

Apply retains lossless PNG blobs in session history. Preview and PNG/JPEG export
reuse that exact result without another inference. Undo/Redo restores the applied
result. New color, mask or geometry edits invalidate it and require Apply again.
Reference replacement/removal also invalidates the current result. Original files
remain untouched. LUTs and presets remain color-only. Phone screens below 768px
expose Fast only; larger screens also expose experimental AI.

Leaving Enhance, changing inputs/mode, or Cancel terminates the pending worker.
Export is disabled while Apply runs. Stale completions cannot commit results.
Model assets download only on demand and photos remain local.

## Verification — 2026-11-02

- TypeScript checks passed.
- 45 focused tests passed: upscale math/tile layout, editor regressions, applied
  history invalidation, real photographic Fast processing, PNG/JPEG encoding at
  1024x1024, lossless pixel equality, cached export reuse and bitmap cleanup.
- The photographic encoding test uses native Sharp. Export orchestration tests
  use canvas doubles. Neither establishes browser codec/UI correctness.
- Actual native CPU Swin2SR inference executed on a 128x128 photographic fixture
  and returned 256x256 RGB. `node scripts/check-upscale-model.mjs` reproduces it;
  `upscale-model-check.png` retains the output. Visual inspection found distorted
  fine detail / posterized textures. **AI quality remains unresolved** and the UI
  warns about this. Correct dimensions are not evidence of photographic accuracy.
- Browser access host unavailable. Browser WebGPU/WASM inference, live comparison
  alignment, mobile interaction, browser export and memory profiling could not be
  executed. No browser validation or leak-free claim is made.

## Limits / next checks

Output remains capped at 32MP / 16384px per side. Full-resolution preview retains
both RGBA images and canvases; near the cap this can consume hundreds of MB.
History retains compressed applied blobs (up to the existing 40 entries).
Tiling bounds inference input size, not total editor memory. Large-image browser
memory measurements and AI tile-boundary photographic checks remain necessary.
Before calling AI production-ready, investigate the model's degraded texture
reconstruction with native-resolution photographic crops and a reference runtime;
then validate WebGPU and WASM, seams, export and comparison in a real browser.

## Performance follow-up

Successful AI workers now retain one model session for 60 seconds of idle time;
cancellation, failure and expiry still terminate it. The panel displays elapsed
time and the selected backend. See UPSCALE_PERFORMANCE.md for exact-image cold /
warm native CPU measurements, unchanged pixel hashes and GPU validation limits.
