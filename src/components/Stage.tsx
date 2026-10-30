import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  ArrowLeftRight,
  ImagePlus,
  Minus,
  Plus,
  Maximize,
} from "lucide-react";
import type { Mask, Geometry } from "../editor/types";
import { prepareMask, paintMask, strokePoints } from "../processing/masks";
import type { MaskTools } from "./MaskPanel";
import type { Photo } from "../processing/decode";
import type { RenderResult } from "../editor/usePreview";
export default function Stage({
  photo,
  result,
  busy,
  compare,
  setCompare,
  onLoad,
  mask,
  tools,
  onMaskCommit,
  crop,
  cropEditing,
  onCrop,
  aspect,
  onDone,
}: {
  photo: Photo | null;
  result: RenderResult | null;
  busy: boolean;
  compare: boolean;
  setCompare: (v: boolean) => void;
  onLoad: (f: File) => void;
  mask?: Mask;
  tools: MaskTools;
  onMaskCommit: (data: Uint8ClampedArray) => void;
  crop: Geometry;
  cropEditing: boolean;
  onCrop: (g: Geometry) => void;
  aspect: string;
  onDone: () => void;
}) {
  const before = useRef<HTMLCanvasElement>(null),
    after = useRef<HTMLCanvasElement>(null),
    overlay = useRef<HTMLCanvasElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 }),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [split, setSplit] = useState(50);
  const stroke = useRef<{
      data: Uint8ClampedArray;
      last: { x: number; y: number };
    } | null>(null),
    drag = useRef<{
      point: { x: number; y: number };
      pan: { x: number; y: number };
    } | null>(null);
  const raw = tools.editing || cropEditing,
    showCompare = compare && !raw;
  const w = result?.width ?? photo?.preview.width ?? 1,
    h = result?.height ?? photo?.preview.height ?? 1,
    fit = Math.max(0.01, Math.min((size.w - 48) / w, (size.h - 48) / h, 1));
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(([v]) =>
      setSize({ w: v.contentRect.width, h: v.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [photo?.url, w, h, raw]);
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (
        ev.key.toLowerCase() === "f" &&
        !(
          ev.target instanceof HTMLElement &&
          ev.target.closest("input,select,textarea,dialog")
        )
      ) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!photo) return;
    const image = result ?? {
      width: photo.preview.width,
      height: photo.preview.height,
      pixels: photo.preview.data,
      before: photo.preview.data,
    };
    for (const [node, data] of [
      [after.current, image.pixels],
      [before.current, image.before],
    ] as const) {
      if (!node) continue;
      node.width = image.width;
      node.height = image.height;
      node
        .getContext("2d")!
        .putImageData(
          new ImageData(new Uint8ClampedArray(data), image.width, image.height),
          0,
          0,
        );
    }
  }, [photo, result]);
  function drawMask(data?: Uint8ClampedArray) {
    if (!overlay.current || !mask) return;
    const c = overlay.current;
    c.width = mask.width;
    c.height = mask.height;
    const ctx = c.getContext("2d")!,
      image = ctx.createImageData(mask.width, mask.height),
      prepared = prepareMask({ ...mask, data: data ?? mask.data });
    for (let i = 0; i < prepared.length; i++) {
      image.data[i * 4] = 181;
      image.data[i * 4 + 1] = 133;
      image.data[i * 4 + 2] = 255;
      image.data[i * 4 + 3] = (prepared[i] * tools.overlay) / 100;
    }
    ctx.putImageData(image, 0, 0);
  }
  useEffect(() => {
    drawMask();
  }, [mask, tools.overlay, tools.editing, result]);
  const point = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };
  function move(e: React.PointerEvent) {
    if (stroke.current && mask) {
      const p = point(e),
        s = stroke.current;
      s.data = paintMask(
        { ...mask, data: s.data },
        strokePoints(s.last, p, tools.radius),
        tools.radius,
        tools.erase,
      );
      s.last = p;
      drawMask(s.data);
    } else if (drag.current && cropEditing) {
      const p = point(e),
        a = drag.current.point;
      let width = Math.max(0.01, Math.abs(p.x - a.x)),
        height = Math.max(0.01, Math.abs(p.y - a.y));
      const ratio = aspect === "original" ? w / h : Number(aspect);
      if (Number.isFinite(ratio) && ratio > 0) {
        height = (width * w) / h / ratio;
        if (height > 1 - Math.min(a.y, p.y)) {
          height = 1 - Math.min(a.y, p.y);
          width = ((height * h) / w) * ratio;
        }
      }
      onCrop({
        ...crop,
        x: Math.min(a.x, p.x),
        y: Math.min(a.y, p.y),
        width: Math.min(width, 1 - Math.min(a.x, p.x)),
        height: Math.min(height, 1 - Math.min(a.y, p.y)),
      });
    } else if (drag.current) {
      setPan({
        x: drag.current.pan.x + e.clientX - drag.current.point.x,
        y: drag.current.pan.y + e.clientY - drag.current.point.y,
      });
    }
  }
  function finish() {
    if (stroke.current) {
      onMaskCommit(stroke.current.data);
      stroke.current = null;
    }
    drag.current = null;
  }
  return (
    <section className="canvas-area">
      <div className="canvas-bar">
        <span>
          {cropEditing
            ? "CROP · ORIGINAL COORDINATES"
            : tools.editing
              ? "MASK · ORIGINAL COORDINATES"
              : "YOUR PHOTOGRAPH"}
        </span>
        {raw ? (
          <button className="active" onClick={onDone}>
            Done
          </button>
        ) : (
          <button
            className={compare ? "active" : ""}
            onClick={() => setCompare(!compare)}
            disabled={!photo || raw}
            title="Before / After (B)"
          >
            <ArrowLeftRight size={15} />
            Before / After
          </button>
        )}
      </div>
      <div
        ref={viewport}
        className={`studio-viewport ${raw ? "selection-mode" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) onLoad(e.dataTransfer.files[0]);
        }}
        onWheel={(e) => {
          if (photo && !raw)
            setZoom((z) => Math.max(0.25, Math.min(6, z - e.deltaY * 0.001)));
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget && photo && !raw) {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { point: { x: e.clientX, y: e.clientY }, pan };
          }
        }}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {photo ? (
          <div
            ref={stage}
            className="photo-stage"
            style={{
              width: w * fit * zoom,
              height: h * fit * zoom,
              transform: `translate(${pan.x}px,${pan.y}px)`,
            }}
            onPointerDown={(e) => {
              if (raw && busy) return;
              if (e.target instanceof HTMLInputElement) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              if (cropEditing) {
                drag.current = { point: point(e), pan };
              } else if (tools.editing && mask) {
                const p = point(e),
                  data = paintMask(mask, [p], tools.radius, tools.erase);
                stroke.current = { data, last: p };
                drawMask(data);
              } else {
                drag.current = { point: { x: e.clientX, y: e.clientY }, pan };
              }
            }}
          >
            <canvas
              ref={before}
              className="photo-layer"
              aria-label="Original image"
              style={{
                clipPath: showCompare
                  ? `inset(0 ${100 - split}% 0 0)`
                  : "inset(0 100% 0 0)",
              }}
            />
            <canvas
              ref={after}
              className="photo-layer"
              aria-label="Edited image"
              style={{
                clipPath: showCompare ? `inset(0 0 0 ${split}%)` : undefined,
              }}
            />
            {showCompare && (
              <>
                <span className="compare-label left">BEFORE</span>
                <span className="compare-label right">AFTER</span>
                <div className="compare-divider" style={{ left: `${split}%` }}>
                  <ArrowLeftRight size={20} />
                </div>
                <input
                  className="compare-range"
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={split}
                  aria-label="Before after divider"
                  onChange={(e) => setSplit(+e.target.value)}
                />
              </>
            )}
            {tools.editing && mask && (
              <canvas
                ref={overlay}
                className="photo-layer mask-overlay"
                aria-label="Selected mask overlay"
              />
            )}
            {cropEditing && (
              <div
                className="crop-box"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
              >
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        ) : (
          <div className="studio-empty">
            <div className="empty-symbol">
              <Aperture size={40} />
            </div>
            <span className="eyebrow">YOUR LIGHT. YOUR POINT OF VIEW.</span>
            <h1>
              A little light.
              <br />A whole new feeling.
            </h1>
            <p>
              Shape the colors. Find your look.
              <br />A private photo studio, right on your device.
            </p>
            <button
              className="button primary"
              onClick={() => input.current?.click()}
            >
              <ImagePlus size={17} />
              Open a photograph
            </button>
            <small>JPEG, PNG, WebP · Nothing is uploaded</small>
          </div>
        )}
        {busy && (
          <div className="preview-busy" role="status">
            Developing preview…
          </div>
        )}
      </div>
      <div className="viewbar">
        <span>
          {photo
            ? `${photo.width} × ${photo.height} original pixels`
            : "Tip: open a photo, then start with Light in Edit."}
        </span>
        <div>
          <button
            title="Zoom out"
            disabled={!photo || raw}
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(fit * zoom * 100)}%</span>
          <button
            title="Zoom in"
            disabled={!photo || raw}
            onClick={() => setZoom((z) => Math.min(6, z + 0.25))}
          >
            <Plus size={15} />
          </button>
          <button
            title="Fit image (F)"
            disabled={!photo}
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <Maximize size={15} />
          </button>
          <button
            title="100% pixel view"
            disabled={!photo || raw}
            onClick={() => setZoom(1 / fit)}
          >
            1:1
          </button>
        </div>
      </div>
      <input
        hidden
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) onLoad(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </section>
  );
}
