# AI Upscaler performance investigation (2026-11-02)

## Changes

- Keep one successful AI worker/model session idle for 60 seconds. Repeated Apply
  can reuse it; expiry/cancel/failure terminates it. Active jobs never share a worker.
- Failed initialization is evicted; GPU failure still retries in a fresh CPU worker.
- Alpha validation visits alpha bytes only; RGB packing/stitching uses direct
  channel copies. The Swin2SR FP32 model, 128px cores, 32px halos, padding, and
  normalization remain identical. No quantization, reduced overlap or resize.
- UI displays elapsed processing time, actual selected WebGPU/CPU backend and warm
  session state. Stored results retain timings. Instrumentation separately records
  model/session initialization, tile packing, model-pipeline calls and stitching.

## Measurements and limits

The user-supplied photograph `istockphoto-2082112210-612x612-lightdna.png`
is actually 1224x816. It was used unchanged for before/after native CPU ONNX
inference with the existing disk-cached FP32 model, 70 tiles, 2448x1632 output.
No copy of this photograph or its output was saved; results retain only timings
and an output hash. Native CPU is NOT browser WASM or Intel Arc/D3D12.

| Measurement | Before | After |
|---|---:|---:|
| Session initialization, cached weights | 5.839 s | 6.886 s |
| First inference pass (including tile handling) | 112.434 s | 114.480 s |
| Warm inference pass | 117.351 s | 108.725 s |
| First-pass overhead outside model pipeline | 0.162 s | 0.078 s |
| Warm overhead outside model pipeline | 0.213 s | 0.080 s |

The apparent 7.4% warm improvement is a single-sample result and is NOT established
as a throughput gain: the small CPU-loop savings cannot explain it, and other
runs show substantial runtime variation. First inference was 1.8% slower. The
model pipeline accounts for over 99.8% of elapsed processing. Session reuse avoids
reinitialization on subsequent Apply within 60 seconds, but its browser wall-time
benefit has not yet been measured. The native benchmark intentionally keeps the
model loaded for both variants' warm measurement, isolating inference from load.
All four output SHA-256 hashes are identical:
`9f13392fa7984e3f39426b5687bcf6acc2739420fa3bd80b56ec7cb9fa2250eb`.
Thus these changes produced zero pixel differences on this native CPU photograph.

Session-cold means a newly initialized model, NOT an uncached model download.
Full Apply also includes decode, editing and PNG encoding, outside these timings.
Raw reports: `scripts/benchmark-user-before.json` and
`scripts/benchmark-user-after.json`. Earlier fixture results are retained separately.

Reproduce with `node scripts/benchmark-upscale.mjs before "LOCAL_PHOTO_PATH"`,
then `node scripts/benchmark-upscale.mjs after "LOCAL_PHOTO_PATH"`. Without a path,
the script uses the bundled astronaut resized to 1200x800. The baseline snapshot
in scripts/upscale-baseline.ts is only for repeatable comparison.

The measured inferenceMs includes processor normalization/padding, model execution,
transfers, output conversion and readback; it is NOT isolated GPU-kernel time.
Packing/stitching are outside this timing. The browser connector was unavailable. Native Chrome control opened the local
benchmark page, but file-picker automation failed with modal geometry/cache
errors; the dialog was dismissed. Actual Intel Arc GPU transfer/kernel profiling
and browser session reuse speedup remain unverified. A high GPU utilization percentage alone cannot distinguish
arithmetic from memory or kernel scheduling bottlenecks.

For browser measurement, run the dev server and open
/tests/browser/upscale-benchmark.html. Select the same local photograph, reload for
a fresh session, and Run cold and warm. It reports actual backend, wall time,
component timings and output differences. Photos never leave the computer.
The warm run is immediate, within the 60-second session retention window.

## Findings and next candidate

Swin2SR's pipeline dominates the CPU measurements; local stitching optimization
cannot plausibly account for a large reduction in inference time. Session reuse
avoids repeat initialization, but does not reduce the model's arithmetic.

ORT documents that CPU tensors are copied to/from GPU by default. IO binding could
keep later operations on GPU, but this editor needs CPU pixels for PNG encoding.
Graph capture requires static shapes and all-GPU kernels; our edge tiles have
varying shapes. Neither was enabled without browser profiling/compatibility checks.
Source: [ORT WebGPU documentation](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html)

Investigated SPAN as a next lightweight candidate: the official implementation
and paper target efficient super-resolution. No compatible 2x browser ONNX model
was validated here, so no untested replacement is shipped. Swin2SR remains intact.
Next step: validate a licensed 2x SPAN export, then compare native crops, tile seams
and browser GPU/WASM timings against Swin2SR before introducing an optional mode.
Source: [Official SPAN implementation](https://github.com/hongyuanyu/SPAN)

Existing AI detail distortion is not fixed by these performance changes. Pixel
identity checks establish no additional degradation, not absolute image quality.

## Verification

TypeScript checks and 17 focused tests passed. Tests cover model reuse, rejected
initialization retry, active-worker isolation, late cancellation, idle expiry,
CPU fallback telemetry, transfer math/stitching and cached export. Real model
inference above is separate from these controlled regression tests.
No production build or unrelated/full-suite tests were run for this change.
