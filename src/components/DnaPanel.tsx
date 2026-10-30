import Upload from "./Upload";
import { Slider, Group } from "./Controls";
import { useEditor } from "../store";
import type { Photo } from "../processing/decode";
import type { Analysis } from "../processing/analysis";
export default function DnaPanel({
  reference,
  analysis,
  onLoad,
  onRemove,
  busy,
  advanced,
}: {
  reference: Photo | null;
  analysis: Analysis | null;
  onLoad: (f: File) => void;
  onRemove: () => void;
  busy: boolean;
  advanced: boolean;
}) {
  const e = useEditor();
  return (
    <>
      <p className="help">
        Borrow a color atmosphere, while keeping your photograph’s character.
        Color and tone matching, not scene relighting.
      </p>
      <Upload label="Reference" photo={reference} busy={busy} onLoad={onLoad} />
      {reference && (
        <button className="subtle" onClick={onRemove}>
          Remove reference
        </button>
      )}
      {analysis && (
        <>
          <div className="palette-swatches">
            {analysis.palette.map((p, i) => (
              <span key={i} style={{ background: p }} title={p} />
            ))}
          </div>
          <div
            className="histogram"
            role="img"
            aria-label="Reference luminance histogram"
          >
            {analysis.histogram.map((v, i) => (
              <span
                key={i}
                style={{
                  height: `${Math.max(2, (v / Math.max(...analysis.histogram, 1)) * 100)}%`,
                }}
              />
            ))}
          </div>
        </>
      )}
      <Slider
        label="Color transfer strength"
        min={0}
        reset={70}
        value={e.params.strength}
        onChange={(v) => e.set("strength", v)}
      />
      <label className="field-label">
        Matching method
        <select
          value={e.style.method}
          onChange={(v) =>
            e.updateStyle({
              method: v.target.value as "classic" | "perceptual",
            })
          }
        >
          <option value="perceptual">Perceptual · gentle tonal matching</option>
          <option value="classic">Classic · original Lab transfer</option>
        </select>
      </label>
      {e.style.method === "perceptual" && (
        <Slider
          label="Tone match strength"
          min={0}
          reset={70}
          value={e.style.toneStrength}
          onChange={(v) => e.updateStyle({ toneStrength: v })}
        />
      )}
      <Group title="Preserve skin tones" open={advanced}>
        <label className="field-label">
          Skin protection mask
          <select
            value={e.style.skinMaskId ?? ""}
            onChange={(v) =>
              e.updateStyle({ skinMaskId: v.target.value || null })
            }
          >
            <option value="">Choose a skin mask</option>
            {e.masks.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {!m.enabled ? " (disabled)" : ""}
              </option>
            ))}
          </select>
        </label>
        <Slider
          label="Skin protection"
          min={0}
          value={e.style.skinProtection}
          disabled={!e.style.skinMaskId}
          onChange={(v) => e.updateStyle({ skinProtection: v })}
        />
        <p className="help">
          Create a Skin mask in AI Tools first. Inspect and correct it with
          Brush; only its selected area is protected from Color DNA.
        </p>
      </Group>
      <Group title="Advanced matching settings" open={advanced}>
        {e.style.method === "perceptual" ? (
          <Slider
            label="Chroma match strength"
            min={0}
            reset={70}
            value={e.style.chromaStrength}
            onChange={(v) => e.updateStyle({ chromaStrength: v })}
          />
        ) : (
          <p className="help">
            Classic mode retains the original Lab mean/variance transfer for
            compatible presets.
          </p>
        )}
        <p className="help">
          Perceptual matching anchors black and white, limits luminance shifts,
          and tempers extreme chroma. Reference statistics stay fixed for
          consistent export and LUTs.
        </p>
      </Group>
    </>
  );
}
