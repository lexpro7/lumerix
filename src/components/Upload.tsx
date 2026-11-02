import { t } from "../i18n";
import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import type { Photo } from "../processing/decode";

export default function Upload({
  label,
  photo,
  onLoad,
  busy,
  onRemove,
}: {
  label: string;
  photo: Photo | null;
  onLoad: (f: File) => void;
  busy: boolean;
  onRemove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  function drop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files[0]) onLoad(e.dataTransfer.files[0]);
  }
  return (
    <div className="upload-section">
      <div className="section-label">
        <span>{t(label)}</span>
        {photo && <span className="tag">{t("LOADED")}</span>}
      </div>
      <button
        className={`upload ${drag ? "drag" : ""} ${photo ? "has-photo" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={drop}
        aria-label={t(`Upload ${label.toLowerCase()} image`)}
        disabled={busy}
      >
        {photo ? (
          <>
            <img src={photo.url} alt={t(`${label} thumbnail`)} />
            <span className="replace">{t("Replace image")}</span>
          </>
        ) : (
          <>
            <ImagePlus size={24} />
            <strong>{t(`Drop your ${label.toLowerCase()} here`)}</strong>
            <span>{t("or click to browse")}</span>
          </>
        )}
        {busy && (
          <span className="upload-loading">
            <LoaderCircle className="spin" />{t("Decoding…")}</span>
        )}
      </button>
      <div className="mobile-upload">
        {photo && <img src={photo.url} alt={t(`${label} thumbnail`)} />}
        <button type="button" className="button" disabled={busy}
          aria-label={t(photo ? `Replace ${label.toLowerCase()} image` : undefined)}
          onClick={() => input.current?.click()}>
          {busy ? <LoaderCircle size={20} className="spin" aria-hidden="true" /> : <ImagePlus size={20} aria-hidden="true" />}
          {t(photo ? "Replace" : label === "Reference" ? "Choose Reference" : "Choose Photo")}
        </button>
        {photo && onRemove && <button type="button" className="button subtle" disabled={busy}
          aria-label={t(`Remove ${label.toLowerCase()} image`)} onClick={onRemove}>{t("Remove")}</button>}
        {busy && <span className="mobile-upload-status" role="status">{t("Reading image...")}</span>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) onLoad(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {photo ? (
        <p className="file-name" title={photo.name}>
          {photo.name}
          <span>
            {t(photo.width)} × {t(photo.height)}
          </span>
        </p>
      ) : (
        <p className="file-hint">{t("JPG, PNG, WebP · up to 80 MB")}</p>
      )}
    </div>
  );
}
