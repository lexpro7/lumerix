import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import type { Photo } from "../processing/decode";
import type { Analysis } from "../processing/analysis";
import type { DocumentState } from "../editor/types";
import { job } from "../processing/client";
import { exportPhoto, download } from "../processing/export";
import { geometryDimensions } from "../processing/geometry";
import { lutIncluded, lutExcluded } from "../processing/lut";
import { Slider } from "./Controls";
export default function ExportDialog({
  photo,
  source,
  reference,
  document,
  initialTab,
  onClose,
}: {
  photo: Photo;
  source: Analysis;
  reference: Analysis | null;
  document: DocumentState;
  initialTab: "image" | "lut";
  onClose: () => void;
}) {
  const [tab, setTab] = useState(initialTab),
    [format, setFormat] = useState("image/jpeg"),
    [quality, setQuality] = useState(92),
    [size, setSize] = useState(33),
    [name, setName] = useState("LightDNA look"),
    [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState(""),
    [lut, setLut] = useState<Blob | null>(null),
    [lutBusy, setLutBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    task = useRef<ReturnType<typeof exportPhoto> | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => task.current?.cancel();
  }, []);
  useEffect(() => {
    if (tab !== "lut") return;
    setLutBusy(true);
    setLut(null);
    setError("");
    const t = job<{ blob: Blob; preview: Uint8ClampedArray }>({
      kind: "lut",
      document,
      source,
      reference,
      size,
      name,
      pixels: photo.preview.data,
    });
    let active = true;
    t.promise
      .then((result) => {
        if (!active) return;
        setLut(result.blob);
        setLutBusy(false);
        if (preview.current) {
          preview.current.width = photo.preview.width;
          preview.current.height = photo.preview.height;
          preview.current
            .getContext("2d")!
            .putImageData(
              new ImageData(
                new Uint8ClampedArray(result.preview),
                photo.preview.width,
                photo.preview.height,
              ),
              0,
              0,
            );
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLutBusy(false);
        }
      });
    return () => {
      active = false;
      t.cancel();
    };
  }, [tab, size, name, document, source, reference, photo]);
  async function saveImage() {
    setProgress(0);
    setError("");
    try {
      task.current = exportPhoto(
        photo,
        source,
        reference,
        document.params,
        format,
        quality / 100,
        setProgress,
        document,
      );
      const blob = await task.current.promise;
      download(
        blob,
        `${photo.name.replace(/\.[^.]+$/, "")}-lightdna.${format === "image/png" ? "png" : "jpg"}`,
      );
      onClose();
    } catch (e) {
      if (e instanceof Error && e.message !== "Cancelled") setError(e.message);
    } finally {
      setProgress(null);
      task.current = null;
    }
  }
  const dimensions = geometryDimensions(
    photo.width,
    photo.height,
    document.geometry,
  );
  return (
    <dialog
      ref={dialog}
      className="studio-dialog"
      onCancel={(e) => {
        if (progress !== null) e.preventDefault();
        else onClose();
      }}
    >
      <div className="dialog-top">
        <div>
          <span className="eyebrow">TAKE YOUR VISION WITH YOU</span>
          <h2>{tab === "lut" ? "LUT Studio" : "Export photograph"}</h2>
        </div>
        <button
          title="Close export"
          disabled={progress !== null}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="segmented">
        <button
          className={tab === "image" ? "active" : ""}
          disabled={progress !== null}
          onClick={() => setTab("image")}
        >
          Photograph
        </button>
        <button
          className={tab === "lut" ? "active" : ""}
          disabled={progress !== null}
          onClick={() => setTab("lut")}
        >
          3D LUT · .cube
        </button>
      </div>
      {error && (
        <p className="dialog-error" role="alert">
          {error}
        </p>
      )}
      {tab === "image" ? (
        <>
          <p className="help">
            {dimensions.width} × {dimensions.height} pixels ·
            Original-resolution processing with all global, local and geometry
            edits.
          </p>
          <label className="field-label">
            File format
            <select
              disabled={progress !== null}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
            </select>
          </label>
          {format === "image/jpeg" && (
            <>
              <Slider
                label="JPEG quality"
                min={50}
                reset={92}
                value={quality}
                onChange={setQuality}
                disabled={progress !== null}
              />
              <p className="help">
                Transparent regions and rotated corners are filled with white.
              </p>
            </>
          )}
          {progress === null ? (
            <button className="button primary full" onClick={saveImage}>
              <Download size={16} />
              Export image
            </button>
          ) : (
            <>
              <progress max={1} value={progress} />
              <p role="status">
                {progress >= 0.9
                  ? "Encoding image…"
                  : `Processing ${Math.round(progress * 100)}%`}
              </p>
              <button
                className="button secondary full"
                onClick={() => task.current?.cancel()}
              >
                Cancel export
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <label className="field-label">
            LUT name
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field-label">
            Grid size
            <select value={size} onChange={(e) => setSize(+e.target.value)}>
              <option value={17}>17 × 17 × 17 · compact</option>
              <option value={33}>33 × 33 × 33 · recommended</option>
              <option value={65}>65 × 65 × 65 · fine</option>
            </select>
          </label>
          <canvas
            ref={preview}
            className="lut-preview"
            aria-label="Preview of exported LUT applied to original photo"
          />
          <p className="help">
            Actual interpolated LUT preview · original framing · global effects
            only. Strong curves and color selections can need a finer grid.
          </p>
          <details open>
            <summary>Included global transformations</summary>
            <ul>
              {lutIncluded.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
          <details open>
            <summary>Excluded from this LUT</summary>
            <ul>
              {lutExcluded.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
          <p className="help">
            Color DNA statistics are frozen from this session. This is an
            sRGB-to-sRGB LUT; matching on another photograph may differ.
          </p>
          <button
            className="button primary full"
            disabled={lutBusy || !lut || !name.trim()}
            onClick={() =>
              lut &&
              download(lut, `${name.trim().replace(/[^a-z0-9_-]/gi, "_")}.cube`)
            }
          >
            <Download size={16} />
            {lutBusy ? "Building LUT & preview…" : "Export .cube LUT"}
          </button>
        </>
      )}
      <p className="help center">
        Your images are processed locally. No upload.
      </p>
    </dialog>
  );
}
