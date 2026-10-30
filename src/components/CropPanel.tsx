import { defaultGeometry, type Geometry } from "../editor/types";
import { Slider } from "./Controls";
export default function CropPanel({
  draft,
  setDraft,
  editing,
  setEditing,
  onApply,
  aspect,
  setAspect,
}: {
  draft: Geometry;
  setDraft: (g: Geometry) => void;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onApply: () => void;
  aspect: string;
  setAspect: (s: string) => void;
}) {
  return (
    <>
      <p className="help">
        Drag a rectangle on the image. Crop first, then rotate and flip. Your
        original stays untouched.
      </p>
      {!editing ? (
        <button
          className="button primary full"
          onClick={() => setEditing(true)}
        >
          Edit crop & geometry
        </button>
      ) : (
        <>
          <label className="field-label">
            Aspect ratio
            <select value={aspect} onChange={(e) => setAspect(e.target.value)}>
              <option value="free">Freeform</option>
              <option value="original">Original</option>
              <option value="1">Square · 1:1</option>
              <option value="1.5">Landscape · 3:2</option>
              <option value="1.333333">Landscape · 4:3</option>
              <option value="1.777778">Wide · 16:9</option>
              <option value="0.8">Portrait · 4:5</option>
              <option value="0.666667">Portrait · 2:3</option>
            </select>
          </label>
          <div className="crop-values">
            {(["x", "y", "width", "height"] as const).map((k) => (
              <label key={k}>
                {k}
                <input
                  type="number"
                  aria-label={`Crop ${k} percent`}
                  min={k === "width" || k === "height" ? 1 : 0}
                  max={100}
                  step={0.1}
                  value={+(draft[k] * 100).toFixed(1)}
                  onChange={(e) => {
                    const v = Math.max(
                      k === "width" || k === "height" ? 0.01 : 0,
                      Math.min(1, +e.target.value / 100),
                    );
                    const next = { ...draft, [k]: v };
                    next.x = Math.min(next.x, 1 - next.width);
                    next.y = Math.min(next.y, 1 - next.height);
                    setDraft(next);
                  }}
                />
              </label>
            ))}
          </div>
          <label className="field-label">
            Rotate
            <select
              value={draft.rotation}
              onChange={(e) =>
                setDraft({ ...draft, rotation: +e.target.value })
              }
            >
              {[0, 90, 180, 270].map((v) => (
                <option key={v} value={v}>
                  {v}°
                </option>
              ))}
            </select>
          </label>
          <Slider
            label="Straighten"
            min={-45}
            max={45}
            step={0.1}
            value={draft.straighten}
            onChange={(v) => setDraft({ ...draft, straighten: v })}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.flipX}
              onChange={(e) => setDraft({ ...draft, flipX: e.target.checked })}
            />
            Flip horizontal
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.flipY}
              onChange={(e) => setDraft({ ...draft, flipY: e.target.checked })}
            />
            Flip vertical
          </label>
          <p className="help">
            Rotation and straightening are applied on Done. PNG keeps
            transparent corners; JPEG fills them white.
          </p>
          <button className="button primary full" onClick={onApply}>
            Done · apply geometry
          </button>
          <button
            className="button secondary full"
            onClick={() => setDraft({ ...defaultGeometry })}
          >
            Reset crop & rotation
          </button>
          <button className="subtle full" onClick={() => setEditing(false)}>
            Cancel changes
          </button>
        </>
      )}
    </>
  );
}
