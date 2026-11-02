import { t } from "../i18n";
import { useState, useRef, useLayoutEffect } from "react";
import {
  Brush,
  CloudSun,
  UserRound,
  Scan,
  ScanFace,
  Copy,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEditor } from "../store";
import { localDefaults, type Mask } from "../editor/types";
import { makeMask, combineMasks, sampleMask } from "../processing/masks";
import type { Photo } from "../processing/decode";
import { Slider, Group } from "./Controls";
import { basicControls } from "./EditPanel";
import { disposeAI, portraitSegments, semanticSegments, type Segment } from "../ai/client";
export interface MaskTools {
  selected: string | null;
  setSelected: (id: string | null) => void;
  editing: boolean;
  setEditing: (b: boolean) => void;
  erase: boolean;
  setErase: (b: boolean) => void;
  radius: number;
  setRadius: (v: number) => void;
  overlay: number;
  setOverlay: (v: number) => void;
}
export default function MaskPanel({
  photo,
  active,
  tools,
  onError,
}: {
  photo: Photo | null;
  active: boolean;
  tools: MaskTools;
  onError: (s: string) => void;
}) {
  const e = useEditor(),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [segments, setSegments] = useState<Segment[]>([]),
    [operation, setOperation] = useState<"new" | "add" | "subtract">("new");
  const generation = useRef(0);
  useLayoutEffect(() => {
    generation.current++;
    setBusy(false);
    setSegments([]);
    setStatus("");
    return () => {
      generation.current++;
      disposeAI();
    };
  }, [photo, active]);
  const selected = e.masks.find((m) => m.id === tools.selected);
  const update = (patch: Partial<Mask>, label = "Edit mask") => {
    if (selected)
      e.setMasks(
        e.masks.map((m) => (m.id === selected.id ? { ...m, ...patch } : m)),
        label,
      );
  };
  function add(segment?: Segment, kind: Mask["kind"] = "manual") {
    if (!photo) return;
    const current = useEditor.getState();
    const currentMask = current.masks.find((m) => m.id === tools.selected);
    const mask = makeMask(
      photo.width,
      photo.height,
      segment?.label ?? `Brush ${current.masks.length + 1}`,
      kind,
    );
    if (segment)
      for (let y = 0; y < mask.height; y++)
        for (let x = 0; x < mask.width; x++)
          mask.data[y * mask.width + x] =
            sampleMask(
              segment.data,
              segment.width,
              segment.height,
              (x + 0.5) / mask.width,
              (y + 0.5) / mask.height,
            ) * 255;
    if (segment && !mask.data.some((v) => v > 0)) {
      onError(
        "No matching region was detected. Use Brush to make a selection.",
      );
      return;
    }
    if (currentMask && operation !== "new" && segment) {
      current.setMasks(
        current.masks.map((m) =>
          m.id === currentMask.id
            ? { ...m, data: combineMasks(m.data, mask.data, operation) }
            : m,
        ),
        `${operation} selection`,
      );
    } else {
      current.setMasks([...current.masks, mask], "Create mask");
      tools.setSelected(mask.id);
    }
    tools.setEditing(true);
    setSegments([]);
  }
  async function automatic(kind: "sky" | "person" | "skin" | "object") {
    if (!photo || !active) return;
    const id = ++generation.current;
    setBusy(true);
    setStatus("Preparing local AI…");
    onError("");
    try {
      const output =
        kind === "person" || kind === "skin"
          ? await portraitSegments(photo, (s) => {
              if (id === generation.current) setStatus(s);
            })
          : await semanticSegments(photo, (s) => {
              if (id === generation.current) setStatus(s);
            });
      if (id !== generation.current) return;
      if (kind === "object") {
        setSegments(output);
        setStatus(
          "Choose a detected class. All regions of that class are selected; this model does not support click-to-select.",
        );
      } else {
        const match = output.find((s) => s.label === kind);
        if (!match)
          throw new Error(`No ${kind} was detected. Try Brush instead.`);
        if (!match.data.some((v) => v > 0))
          throw new Error(`No ${kind} was detected. Try Brush instead.`);
        add(match, kind);
        setStatus(
          "Selection ready. Check edges and correct with Brush or Erase.",
        );
      }
    } catch (error) {
      if (id === generation.current)
        onError(
          error instanceof Error
            ? error.message
            : "AI selection failed. Brush remains available.",
        );
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <>
      <p className="help">{t("Make a selection, then adjust only that area. Masks remain editable after Done.")}</p>
      <div className="model-notice">
        <strong>{t("On-device AI · one-time downloads")}</strong>
        <p>{t("Sky / objects: about 15 MB model, plus up to 30 MB runtime. Person / skin: about 16 MB plus runtime. Downloaded assets are cached for offline reuse; storage eviction may require downloading again. Photos never leave this device.")}</p>
      </div>
      <label className="field-label">{t("Selection operation")}<select
          value={operation}
          onChange={(v) => setOperation(v.target.value as typeof operation)}
        >
          <option value="new">{t("New mask")}</option>
          <option value="add" disabled={!selected}>{t("Add to selected mask")}</option>
          <option value="subtract" disabled={!selected}>{t("Subtract from selected mask")}</option>
        </select>
      </label>
      <div className="tool-grid">
        {(
          [
            ["sky", "Select Sky", CloudSun],
            ["person", "Select Person", UserRound],
            ["skin", "Select Skin", ScanFace],
            ["object", "Select Object", Scan],
          ] as const
        ).map(([kind, label, Icon]) => (
          <button
            key={kind}
            disabled={!photo || busy}
            onClick={() => automatic(kind)}
            title={t(label)}
          >
            <Icon size={18} />
            {t(label)}
          </button>
        ))}
        <button
          disabled={!photo || busy}
          onClick={() => {
            add();
            tools.setErase(false);
          }}
        >
          <Brush size={18} />{t("Brush mask")}</button>
      </div>
      {busy && (
        <>
          <p role="status" className="help">
            {t(status)}
          </p>
          <button
            className="subtle"
            onClick={() => {
              generation.current++;
              setBusy(false);
              setStatus("Selection cancelled.");
              disposeAI();
            }}
          >{t("Cancel selection")}</button>
        </>
      )}
      {!busy && status && (
        <p className="help" role="status">
          {t(status)}
        </p>
      )}
      {segments.length > 0 && (
        <div className="segment-list">
          {segments.map((s, i) => (
            <button key={i} onClick={() => add(s, "object")}>
              {t(s.label)}
            </button>
          ))}
        </div>
      )}
      <p className="help">{t("Skin uses separate face/body-skin classes from a portrait model—not a person silhouette. Results work best on portraits and need review.")}</p>
      <div className="mask-list">
        {e.masks.map((m) => (
          <div key={m.id} className={tools.selected === m.id ? "active" : ""}>
            <button onClick={() => tools.setSelected(m.id)}>{m.name}</button>
            <button
              title={t(m.enabled ? "Disable mask" : "Enable mask")}
              onClick={() =>
                e.setMasks(
                  e.masks.map((x) =>
                    x.id === m.id ? { ...x, enabled: !x.enabled } : x,
                  ),
                  "Toggle mask",
                )
              }
            >
              {m.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              title={t("Duplicate mask")}
              onClick={() => {
                const copy = {
                  ...m,
                  id: crypto.randomUUID(),
                  name: `${m.name} copy`,
                  data: m.data.slice(),
                };
                e.setMasks([...e.masks, copy], "Duplicate mask");
                tools.setSelected(copy.id);
              }}
            >
              <Copy size={14} />
            </button>
            <button
              title={t("Delete mask")}
              onClick={() => {
                e.setMasks(
                  e.masks.filter((x) => x.id !== m.id),
                  "Delete mask",
                );
                tools.setSelected(null);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <>
          <label className="field-label">{t("Mask name")}<input
              value={selected.name}
              maxLength={40}
              onChange={(v) =>
                update({ name: v.target.value }, "Adjust mask name")
              }
            />
          </label>
          <div className="segmented">
            <button
              className={!tools.erase ? "active" : ""}
              onClick={() => {
                tools.setErase(false);
                tools.setEditing(true);
              }}
            >{t("Brush / Add")}</button>
            <button
              className={tools.erase ? "active" : ""}
              onClick={() => {
                tools.setErase(true);
                tools.setEditing(true);
              }}
            >{t("Erase / Subtract")}</button>
          </div>
          <Slider
            label="Brush size"
            min={1}
            max={30}
            value={tools.radius * 100}
            reset={5}
            onChange={(v) => tools.setRadius(v / 100)}
          />
          <Slider
            label="Overlay visibility"
            min={0}
            value={tools.overlay}
            reset={45}
            onChange={tools.setOverlay}
          />
          <button
            className="button primary full"
            onClick={() => tools.setEditing(!tools.editing)}
          >
            {t(tools.editing ? "Done selecting" : "Edit selection")}
          </button>
          <p className="help">{t("Selection editing shows the uncropped original coordinates. Crop and rotation return when you press Done.")}</p>
          <Group title={t("Selection edges")} open>
            <Slider
              label="Feather edges"
              min={0}
              reset={2}
              value={selected.feather}
              onChange={(v) => update({ feather: v }, "Adjust mask feather")}
            />
            <Slider
              label="Edge refinement"
              value={selected.edge}
              onChange={(v) => update({ edge: v }, "Adjust mask edge")}
            />
            <Slider
              label="Mask opacity"
              min={0}
              reset={100}
              value={selected.opacity}
              onChange={(v) => update({ opacity: v }, "Adjust mask opacity")}
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={selected.invert}
                onChange={(v) =>
                  update({ invert: v.target.checked }, "Invert mask")
                }
              />{t("Invert selection")}</label>
          </Group>
          <Group
            title={t("Local adjustments")}
            open
            onReset={() =>
              update(
                { adjustments: { ...localDefaults } },
                "Reset mask adjustments",
              )
            }
          >
            {basicControls
              .filter((c) => c.key in localDefaults)
              .map((c) => (
                <Slider
                  key={c.key}
                  label={c.label}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={
                    selected.adjustments[c.key as keyof typeof localDefaults]
                  }
                  onChange={(v) =>
                    update(
                      { adjustments: { ...selected.adjustments, [c.key]: v } },
                      `Adjust mask ${c.key}`,
                    )
                  }
                />
              ))}
          </Group>
        </>
      )}
    </>
  );
}
