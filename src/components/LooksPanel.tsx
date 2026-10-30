import { useEffect, useState, useRef } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { db, useEditor, type Preset, type Palette } from "../store";
import { defaults, type Params } from "../processing/adjustments";
import { defaultStyle, normalizeStyle, type Style } from "../editor/types";
import { globalTransform } from "../processing/global";
import type { Photo } from "../processing/decode";
import type { Analysis } from "../processing/analysis";
import { Slider } from "./Controls";
const builtin: {
  name: string;
  params: Partial<Params>;
  style?: Partial<Style>;
}[] = [
  {
    name: "Clean daylight",
    params: { contrast: 8, saturation: 8, highlights: -12 },
  },
  {
    name: "Soft cinema",
    params: {
      contrast: -12,
      shadows: 18,
      highlights: -22,
      saturation: -14,
      warmth: 8,
    },
  },
  {
    name: "Amber hour",
    params: { warmth: 24, contrast: 10, saturation: 12, highlights: -18 },
  },
  {
    name: "Quiet silver",
    params: { saturation: -100, contrast: 16, shadows: 12 },
  },
  {
    name: "Coastal air",
    params: { warmth: -16, saturation: -8, shadows: 16 },
    style: {
      grading: [
        { hue: 195, amount: 14 },
        { hue: 35, amount: 5 },
        { hue: 45, amount: 8 },
      ],
    },
  },
  {
    name: "Faded print",
    params: { contrast: -18, saturation: -20, warmth: 10 },
    style: { curve: [0.04, 0.27, 0.5, 0.74, 0.96] },
  },
];
const library: Palette[] = [
  {
    name: "Desert light",
    colors: ["#392c41", "#965f5a", "#c58d68", "#e5be88", "#f4dfb4"],
  },
  {
    name: "Nordic coast",
    colors: ["#172d39", "#385a62", "#789e9b", "#b2bbb2", "#e8dfcc"],
  },
  {
    name: "Rose garden",
    colors: ["#2d3038", "#655b70", "#a77889", "#c6a2a2", "#eee0d2"],
  },
];
function LookPreview({
  photo,
  analysis,
  reference,
  params,
  style,
}: {
  photo: Photo | null;
  analysis: Analysis | null;
  reference: Analysis | null;
  params: Partial<Params>;
  style?: Partial<Style>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current || !photo || !analysis) return;
    const c = canvas.current,
      ctx = c.getContext("2d")!,
      p = photo.preview,
      transform = globalTransform(
        { ...defaults, ...params },
        normalizeStyle(style),
        analysis,
        reference,
      ),
      image = ctx.createImageData(96, 64);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 96; x++) {
        const sx = Math.min(p.width - 1, Math.floor((x / 96) * p.width)),
          sy = Math.min(p.height - 1, Math.floor((y / 64) * p.height)),
          i = (sy * p.width + sx) * 4,
          j = (y * 96 + x) * 4;
        image.data.set(transform([p.data[i], p.data[i + 1], p.data[i + 2]]), j);
        image.data[j + 3] = p.data[i + 3];
      }
    ctx.putImageData(image, 0, 0);
  }, [photo, analysis, reference, params, style]);
  return photo ? (
    <canvas
      ref={canvas}
      width={96}
      height={64}
      aria-label="Global look preview"
    />
  ) : (
    <span className="look-placeholder">Add a photo to preview</span>
  );
}
export default function LooksPanel({
  photo,
  analysis,
  reference,
  onError,
  onLut,
}: {
  photo: Photo | null;
  analysis: Analysis | null;
  reference: Analysis | null;
  onError: (s: string) => void;
  onLut: () => void;
}) {
  const e = useEditor(),
    [presets, setPresets] = useState<Preset[]>([]),
    [palettes, setPalettes] = useState<Palette[]>([]),
    [name, setName] = useState(""),
    [paletteName, setPaletteName] = useState(""),
    [colors, setColors] = useState([
      "#3c3455",
      "#857392",
      "#bb9aa3",
      "#d6bba9",
      "#f4e3cf",
    ]),
    [favoriteOnly, setFavoriteOnly] = useState(false),
    [favorites, setFavorites] = useState<string[]>(() => {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem("lightdna-favorites") ?? "[]",
        );
        return Array.isArray(saved)
          ? saved.filter((v): v is string => typeof v === "string")
          : [];
      } catch {
        return [];
      }
    });
  const refresh = async () => {
    setPresets(await db.presets.toArray());
    setPalettes(await db.palettes.toArray());
  };
  useEffect(() => {
    refresh().catch(() => onError("Local style storage is unavailable."));
  }, []);
  async function storage(action: () => Promise<unknown>) {
    try {
      await action();
      await refresh();
    } catch {
      onError("Could not update local styles. Check browser storage.");
    }
  }
  const favorite = (key: string) => {
    const next = favorites.includes(key)
      ? favorites.filter((x) => x !== key)
      : [...favorites, key];
    setFavorites(next);
    try {
      localStorage.setItem("lightdna-favorites", JSON.stringify(next));
    } catch {
      onError("Favorites could not be saved.");
    }
  };
  return (
    <>
      <p className="help">
        Presets save parameters. Palettes guide color. LUTs carry a global color
        transform to other apps.
      </p>
      <Slider
        label="Look strength"
        min={0}
        reset={100}
        value={e.style.lookStrength}
        onChange={(v) => e.updateStyle({ lookStrength: v })}
      />
      <label className="checkbox">
        <input
          type="checkbox"
          checked={favoriteOnly}
          onChange={(v) => setFavoriteOnly(v.target.checked)}
        />
        Favorites only
      </label>
      <h3 className="section-title">Studio looks</h3>
      <div className="looks-grid">
        {builtin
          .filter((p) => !favoriteOnly || favorites.includes(p.name))
          .map((p) => (
            <div className="look-card" key={p.name}>
              <button
                onClick={() => e.apply({ ...defaults, ...p.params }, p.style)}
                title={`Apply ${p.name}`}
              >
                <LookPreview
                  photo={photo}
                  analysis={analysis}
                  reference={reference}
                  params={p.params}
                  style={p.style}
                />
                <span>{p.name}</span>
              </button>
              <button
                title={`Favorite ${p.name}`}
                aria-pressed={favorites.includes(p.name)}
                onClick={() => favorite(p.name)}
              >
                <Star
                  size={12}
                  fill={favorites.includes(p.name) ? "currentColor" : "none"}
                />
              </button>
            </div>
          ))}
      </div>
      <h3 className="section-title">Your presets</h3>
      <form
        className="inline-form"
        onSubmit={(v) => {
          v.preventDefault();
          if (!name.trim()) return;
          storage(() =>
            db.presets.add({
              name: name.trim(),
              params: { ...e.params },
              style: { ...e.style, skinMaskId: null, skinProtection: 0 },
            }),
          );
          setName("");
        }}
      >
        <input
          aria-label="Preset name"
          placeholder="Name this look…"
          maxLength={48}
          value={name}
          onChange={(v) => setName(v.target.value)}
        />
        <button disabled={!name.trim()}>Save</button>
      </form>
      <p className="help">
        Saves global settings, without masks or geometry. Color DNA needs a
        reference in each session.
      </p>
      {presets
        .filter((p) => !favoriteOnly || p.favorite)
        .map((p) => (
          <div className="saved-look" key={p.id}>
            <button
              className="saved-preview"
              onClick={() => e.apply(p.params, p.style)}
            >
              <LookPreview
                photo={photo}
                analysis={analysis}
                reference={reference}
                params={p.params}
                style={p.style}
              />
              <span>{p.name}</span>
            </button>
            <button
              title={`Favorite ${p.name}`}
              onClick={() =>
                storage(() =>
                  db.presets.update(p.id!, { favorite: !p.favorite }),
                )
              }
            >
              <Star size={13} fill={p.favorite ? "currentColor" : "none"} />
            </button>
            <button
              title={`Rename ${p.name}`}
              onClick={() => {
                const value = prompt("Preset name", p.name);
                if (value?.trim())
                  storage(() =>
                    db.presets.update(p.id!, {
                      name: value.trim().slice(0, 48),
                    }),
                  );
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              title={`Delete ${p.name}`}
              onClick={() => storage(() => db.presets.delete(p.id!))}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      <h3 className="section-title">Palette library</h3>
      {[...library, ...palettes].map((p, i) => (
        <div className="palette-card" key={`${p.name}-${i}`}>
          <button
            onClick={() =>
              e.updateStyle({ palette: p.colors, paletteStrength: 50 })
            }
          >
            <div className="palette-swatches">
              {p.colors.map((c, j) => (
                <span key={j} style={{ background: c }} />
              ))}
            </div>
            {p.name}
          </button>
          {p.id !== undefined && (
            <>
              <button
                title={`Rename ${p.name}`}
                onClick={() => {
                  const value = prompt("Palette name", p.name);
                  if (value?.trim())
                    storage(() =>
                      db.palettes.update(p.id!, {
                        name: value.trim().slice(0, 48),
                      }),
                    );
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                title={`Delete ${p.name}`}
                onClick={() => storage(() => db.palettes.delete(p.id!))}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      ))}
      <Slider
        label="Palette influence"
        min={0}
        value={e.style.paletteStrength}
        disabled={!e.style.palette.length}
        onChange={(v) => e.updateStyle({ paletteStrength: v })}
      />
      <h3 className="section-title">Create a palette</h3>
      <div className="custom-colors">
        {colors.map((c, i) => (
          <input
            key={i}
            type="color"
            aria-label={`Palette color ${i + 1}`}
            value={c}
            onChange={(v) =>
              setColors(colors.map((x, j) => (i === j ? v.target.value : x)))
            }
          />
        ))}
      </div>
      <form
        className="inline-form"
        onSubmit={(v) => {
          v.preventDefault();
          if (!paletteName.trim()) return;
          storage(() => db.palettes.add({ name: paletteName.trim(), colors }));
          setPaletteName("");
        }}
      >
        <input
          placeholder="Palette name…"
          aria-label="Palette name"
          value={paletteName}
          maxLength={48}
          onChange={(v) => setPaletteName(v.target.value)}
        />
        <button disabled={!paletteName.trim()}>Save</button>
      </form>
      <button
        className="button secondary full"
        onClick={() => e.updateStyle({ palette: colors, paletteStrength: 50 })}
      >
        Apply these colors
      </button>
      <button className="button primary full" disabled={!photo} onClick={onLut}>
        Open LUT Studio
      </button>
    </>
  );
}
