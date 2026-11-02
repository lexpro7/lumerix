import { t, errorText } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { useEditor } from "../store";
import type { Photo } from "../processing/decode";
import type { Analysis } from "../processing/analysis";
import type { DocumentState, Enhancement } from "../editor/types";
import { geometryDimensions } from "../processing/geometry";
import { type UpscaleMetrics, upscaleDimensions } from "../processing/upscale";
import { job } from "../processing/client";
export default function EnhancePanel({
  photo,
  source,
  reference,
  document,
  rendering,
  onProcessing,
}: {
  photo: Photo | null;
  source: Analysis | null;
  reference: Analysis | null;
  document: DocumentState;
  rendering: boolean;
  onProcessing: (busy: boolean) => void;
}) {
  const [phone, setPhone] = useState(
    () => matchMedia("(max-width: 767px)").matches,
  );
  const [mode, setMode] = useState<"fast" | "ai">(
    document.upscale === "ai" ? "ai" : "fast",
  );
  const [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState("");
  const [metrics, setMetrics] = useState<UpscaleMetrics | undefined>(
    document.enhanced?.metrics,
  );
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);
  const processing = progress !== null;
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(
      () => setElapsed(performance.now() - started.current),
      250,
    );
    return () => clearInterval(timer);
  }, [processing]);
  const task = useRef<ReturnType<typeof job<Enhancement>> | null>(null),
    generation = useRef(0);
  useEffect(() => {
    onProcessing(progress !== null);
    return () => onProcessing(false);
  }, [progress, onProcessing]);
  const stop = () => {
    generation.current++;
    task.current?.cancel();
    task.current = null;
    setProgress(null);
  };
  useEffect(() => {
    const q = matchMedia("(max-width: 767px)");
    const changed = () => {
      setPhone(q.matches);
      if (q.matches) setMode("fast");
    };
    q.addEventListener("change", changed);
    return () => q.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    stop();
    setError("");
    return () => {
      generation.current++;
      task.current?.cancel();
    };
  }, [photo, document, reference, mode]);
  let dimensions = "Choose a photo",
    limit = "";
  if (photo) {
    try {
      const d = geometryDimensions(
        photo.width,
        photo.height,
        document.geometry,
      );
      const out = upscaleDimensions(d.width, d.height);
      dimensions = `${out.width} x ${out.height} pixels`;
    } catch (e) {
      limit = (e as Error).message;
    }
  }
  async function apply() {
    if (!photo || !source || task.current) return;
    const id = ++generation.current;
    setError("");
    setProgress(0);
    setMetrics(undefined);
    setElapsed(0);
    started.current = performance.now();
    const t = job<Enhancement>(
      {
        kind: "apply-enhance",
        file: photo.file,
        source,
        reference,
        document: {
          ...document,
          enhanced: undefined,
          upscale: phone ? "fast" : mode,
        },
        format: "image/png",
      },
      (v) => {
        if (id === generation.current) setProgress(v);
      },
      (value) => {
        if (id === generation.current) setMetrics(value);
      },
    );
    task.current = t;
    try {
      const enhanced = await t.promise;
      if (id === generation.current)
        setElapsed(performance.now() - started.current);
      if (id === generation.current)
        useEditor
          .getState()
          .commit(
            { enhanced, upscale: phone ? "fast" : mode },
            "Apply 2x upscale",
          );
    } catch (e) {
      if (id === generation.current) setError((e as Error).message);
    } finally {
      if (id === generation.current) {
        task.current = null;
        setProgress(null);
      }
    }
  }
  const shownMetrics = processing
    ? metrics
    : (document.enhanced?.metrics ?? metrics);
  const applied =
    !!document.enhanced && document.upscale === (phone ? "fast" : mode);
  return (
    <>
      <label className="field-label">{t("Mode")}<select
          value={phone ? "fast" : mode}
          disabled={progress !== null}
          onChange={(e) => setMode(e.target.value as "fast" | "ai")}
        >
          <option value="fast">{t("Fast 2x - Bicubic")}</option>
          {!phone && <option value="ai">{t("AI 2x - Swin2SR (experimental)")}</option>}
        </select>
      </label>
      <p role="status">{t("Output resolution:")}{t(dimensions)}</p>
      <button
        className="button full"
        onClick={apply}
        disabled={
          !photo ||
          !source ||
          rendering ||
          !!limit ||
          progress !== null ||
          applied
        }
      >
        {t(applied ? "Applied" : "Apply 2x")}
      </button>
      <p className="help">
        {t(processing || elapsed > 0 || document.enhanced
          ? `${((processing ? elapsed : (document.enhanced?.elapsedMs ?? elapsed)) / 1000).toFixed(1)} s`
          : "Ready")}{" "}
        |{" "}
        {t(mode === "fast"
          ? "CPU resampling"
          : shownMetrics?.backend === "webgpu"
            ? "WebGPU"
            : shownMetrics?.backend === "wasm"
              ? "CPU (WASM)"
              : "Selecting backend")}
        {t(shownMetrics?.warm ? " / Warm session" : "")}
      </p>
      <div role="status" aria-live="polite">
        {progress !== null ? (
          <>
            <progress value={progress} max={1} />
            <p>
              {t(mode === "ai" ? "Loading model / processing" : "Processing")}{" "}
              {Math.round(progress * 100)}%
            </p>
            <button className="button" onClick={stop}>{t("Cancel")}</button>
          </>
        ) : (
          <p className="help">
            {t(applied
              ? "Applied in the workspace. Export uses this exact result. Undo restores the original resolution. New edits require Apply again."
              : mode === "ai"
                ? "Model downloads on demand. AI may alter detail; inspect at 100% before exporting. Photos stay local."
                : "Ready. Apply processes the full edited photograph.")}
          </p>
        )}
      </div>
      {mode === "ai" && (
        <p className="help">{t("Known limitation: photographic testing shows distorted fine details. Fast 2x is recommended until AI quality is resolved.")}</p>
      )}
      {(error || limit) && (
        <p role="alert" className="dialog-error">
          {errorText(error || limit)} {t(error && "Retry or choose Fast 2x.")}
        </p>
      )}
    </>
  );
}
