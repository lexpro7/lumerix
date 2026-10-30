import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import type { Photo } from "../processing/decode";

export default function Upload({
  label,
  photo,
  onLoad,
  busy,
}: {
  label: string;
  photo: Photo | null;
  onLoad: (f: File) => void;
  busy: boolean;
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
        <span>{label}</span>
        {photo && <span className="tag">LOADED</span>}
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
        aria-label={`Upload ${label.toLowerCase()} image`}
        disabled={busy}
      >
        {photo ? (
          <>
            <img src={photo.url} alt={`${label} thumbnail`} />
            <span className="replace">Replace image</span>
          </>
        ) : (
          <>
            <ImagePlus size={24} />
            <strong>Drop your {label.toLowerCase()} here</strong>
            <span>or click to browse</span>
          </>
        )}
        {busy && (
          <span className="upload-loading">
            <LoaderCircle className="spin" />
            Decoding…
          </span>
        )}
      </button>
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
            {photo.width} × {photo.height}
          </span>
        </p>
      ) : (
        <p className="file-hint">JPG, PNG, WebP · up to 80 MB</p>
      )}
    </div>
  );
}
