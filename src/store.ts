import { create } from "zustand";
import Dexie, { type EntityTable } from "dexie";
import { defaults, type Params } from "./processing/adjustments";
import {
  freshDocument,
  normalizeStyle,
  type DocumentState,
  type Style,
  type Geometry,
  type Mask,
} from "./editor/types";
interface HistoryEntry {
  document: DocumentState;
  label: string;
}
interface EditorStore extends DocumentState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastKey: string;
  lastTime: number;
  set: (key: keyof Params, value: number) => void;
  apply: (params: Partial<Params>, style?: Partial<Style>) => void;
  reset: () => void;
  newImage: () => void;
  updateStyle: (style: Partial<Style>) => void;
  setGeometry: (g: Geometry) => void;
  setMasks: (masks: Mask[], label?: string) => void;
  undo: () => void;
  redo: () => void;
  commit: (patch: Partial<DocumentState>, label: string, key?: string) => void;
}
function snapshot(s: DocumentState): DocumentState {
  return {
    params: s.params,
    style: s.style,
    geometry: s.geometry,
    masks: s.masks,
  };
}
export const useEditor = create<EditorStore>()((set, get) => ({
  ...freshDocument(),
  past: [],
  future: [],
  lastKey: "",
  lastTime: 0,
  commit: (patch, label, key = "") =>
    set((s) => {
      const now = Date.now(),
        merge = key && s.lastKey === key && now - s.lastTime < 450;
      return {
        ...patch,
        past: merge
          ? s.past
          : [...s.past, { document: snapshot(s), label }].slice(-40),
        future: [],
        lastKey: key,
        lastTime: now,
      };
    }),
  set: (key, value) =>
    get().commit(
      { params: { ...get().params, [key]: value } },
      `Adjust ${key}`,
      `param:${key}`,
    ),
  apply: (params, style) =>
    get().commit(
      { params: { ...defaults, ...params }, style: normalizeStyle(style) },
      "Apply look",
    ),
  reset: () =>
    get().commit(
      { params: { ...defaults }, style: normalizeStyle() },
      "Reset global adjustments",
    ),
  newImage: () =>
    set({ ...freshDocument(), past: [], future: [], lastKey: "", lastTime: 0 }),
  updateStyle: (style) =>
    get().commit(
      { style: { ...get().style, ...style } },
      "Adjust style",
      `style:${Object.keys(style).join(",")}`,
    ),
  setGeometry: (geometry) =>
    get().commit({ geometry }, "Apply crop & rotation"),
  setMasks: (masks, label = "Edit mask") =>
    get().commit(
      { masks },
      label,
      label.startsWith("Adjust mask")
        ? `${label}:${masks
            .filter((m, i) => m !== get().masks[i])
            .map((m) => m.id)
            .join(",")}`
        : "",
    ),
  undo: () =>
    set((s) => {
      const last = s.past.at(-1);
      return last
        ? {
            ...last.document,
            past: s.past.slice(0, -1),
            future: [{ document: snapshot(s), label: last.label }, ...s.future],
            lastKey: "",
          }
        : {};
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0];
      return next
        ? {
            ...next.document,
            past: [...s.past, { document: snapshot(s), label: next.label }],
            future: s.future.slice(1),
            lastKey: "",
          }
        : {};
    }),
}));
export interface Preset {
  id?: number;
  name: string;
  params: Params;
  style?: Style;
  favorite?: boolean;
}
export interface Palette {
  id?: number;
  name: string;
  colors: string[];
  favorite?: boolean;
}
export const db = new Dexie("lightdna") as Dexie & {
  presets: EntityTable<Preset, "id">;
  palettes: EntityTable<Palette, "id">;
};
db.version(1).stores({ presets: "++id,name" });
db.version(2).stores({ presets: "++id,name", palettes: "++id,name" });
