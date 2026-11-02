# Benchmark-only model comparison - 2026-11-02

The editor's Swin2SR code and available UI modes were not changed.

## Candidate

Real-ESRGAN General v3 (SRVGGNetCompact), FP32 ONNX, approximately 4.87 MB.
This is a **4x neural network followed by 2x2 area reduction for 2x output**,
not a native 2x model. The official lightweight general-scene model is 4x;
the official native x2plus is a larger RRDB model. The small anime model was
not selected for this photographic test.

- [Official model zoo](https://github.com/xinntao/Real-ESRGAN/blob/master/docs/model_zoo.md)
- [Exporter provenance and license](https://huggingface.co/Gaurox/frameshift-models/blob/d31625b21475911656ba0964cb9830328bdf7476/upscale-video-onnx/README.md)
- [Original BSD-3-Clause license](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE)

The benchmark pins the export revision and verifies the published SHA-256 before
creating a session. It uses the existing ONNX Runtime dependency; no packages or
model binaries were added to the application. Models download on demand. Photos
remain local. Browser/WebGPU compatibility is implemented for testing but remains
unverified by actual browser execution in this session.

## Executed comparison

Same machine, same user-provided road photograph, same center 256x256 crop,
bicubic reduction to 128x128, then 256x256 reconstruction. Native ONNX CPU, FP32,
one tile, identical 128px core / 32px halo policy. This is a controlled synthetic
degradation test, NOT full-image GPU timing or general photographic accuracy.

Final diagnostic run (model loading excluded from processing times):

| Metric | Swin2SR | General v3 -> 2x |
|---|---:|---:|
| Cached-model session loading | 8.113 s | 0.035 s |
| First processing pass | 542 ms | 122 ms |
| Warm processing pass | 553 ms | 133 ms |
| Model pipeline, warm | 544 ms | 125 ms |
| Reconstruction PSNR | 39.01 dB | 25.00 dB |
| Mean horizontal RGB gradient | 5.45 | 4.43 |

An earlier run measured warm 531 / 113 ms. These short samples suggest lower
native CPU cost for the candidate, not an established WebGPU or full-image speedup.
Model pipeline timing includes normalization, inference, transfers/readback and
output conversion/downsampling; it is not isolated GPU kernel time.

Visual inspection: candidate output smoothed road grain and simplified vegetation
compared with both the reference crop and Swin2SR. Its lower gradient metric is
consistent with smoothing, but gradient magnitude is not a quality score. Cold
and warm outputs were byte-identical within each model. Both returned correct
2x dimensions with finite RGB outputs. Candidate fidelity was substantially worse
in this controlled test; it is **not approved as an editor replacement**.

Raw results: `scripts/sr-comparison-native.json`.
Reproduce: `node scripts/compare-sr-models.mjs "LOCAL_PHOTO_PATH"`.
Optional `--preview` writes a temporary reference/Swin/candidate contact sheet to
`node_modules/.cache/lightdna-benchmark/quality.png`. The inspected contact sheet
was removed after this run. User image pixels are not retained in the JSON.

## Manual WebGPU test (automation unavailable)

1. Run `npm run dev` and open the printed localhost URL followed by
   `/tests/browser/sr-compare.html`.
2. Choose `istockphoto-2082112210-612x612-lightdna.png` from Downloads. It is
   1224x816; leave the accuracy checkbox OFF for the full-image performance test.
3. Keep **WebGPU (required)** selected and click **Compare cold + warm**.
   Both models run sequentially, twice each, on identical decoded pixels.
   WebGPU failure produces an error; CPU is never silently substituted.
4. Read backend, model-pipeline time, load time, tile count and total time.
   Cold means fresh session, not necessarily empty browser download cache.
   Use Save timing JSON. Repeat under the same power/thermal conditions with
   other GPU work closed before interpreting speed differences.
5. Inspect matched center crops at 100% and download the full outputs to compare
   road grain, grass, thin lines, halos and tile boundaries at 100% / 200%.
   For controlled PSNR, rerun with the accuracy checkbox ON (different input
   dimensions; do not mix those timings with the full-image run).

The page operates entirely locally apart from fetching model/runtime assets. Its
workers terminate after each model's two runs, on Cancel, on error and on page exit;
preview URLs are revoked on the next run or page exit.

## Checks and limitations

- TypeScript passed. Four focused adapter tests passed (packing/channels,
  4x-to-2x geometry, area reduction, wrong-shape/non-finite rejection).
- Actual native CPU inference and visual contact-sheet inspection executed.
- Browser access host unavailable: no actual WebGPU timing, GPU transfer/kernel
  profile or full-image multi-tile candidate quality claim.
- No full-project test suite or production build was run.
- An exported ONNX file is not evidence of browser compatibility or quality.
  Keep Swin2SR unchanged until the manual full-image GPU/quality checks succeed.
