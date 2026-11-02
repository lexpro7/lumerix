import { t, errorText, toolText, matchesTool } from "./i18n";
import { usePreferences } from "./preferences";
import SettingsDialog from "./components/SettingsDialog";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Aperture,
  SlidersHorizontal,
  Sparkles,
  Palette,
  Crop,
  Layers,
  Undo2,
  Redo2,
  Download,
  FolderPlus,
  Search,
  X,
  History,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useEditor } from "./store";
import { decode, type Photo } from "./processing/decode";
import { job } from "./processing/client";
import type { Analysis } from "./processing/analysis";
import {
  defaultGeometry,
  type Workspace,
  type DocumentState,
} from "./editor/types";
import { usePreview } from "./editor/usePreview";
import Upload from "./components/Upload";
import EditPanel from "./components/EditPanel";
import DnaPanel from "./components/DnaPanel";
import MaskPanel from "./components/MaskPanel";
import LooksPanel from "./components/LooksPanel";
import CropPanel from "./components/CropPanel";
import Stage from "./components/Stage";
import ExportDialog from "./components/ExportDialog";
import EnhancePanel from "./components/EnhancePanel";
import PanelHandle, { type PanelState } from "./components/PanelHandle";
import "./studio.css";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}
const workspaces = [
  {
    id: "edit",
    name: "Edit",
    icon: SlidersHorizontal,
    tip: "Light, color and fine adjustments",
  },
  {
    id: "ai",
    name: "AI Tools",
    icon: Sparkles,
    tip: "Smart selections and local adjustments",
  },
  {
    id: "dna",
    name: "Color DNA",
    icon: Aperture,
    tip: "Match a reference atmosphere",
  },
  {
    id: "looks",
    name: "Looks",
    icon: Palette,
    tip: "Presets, palettes and LUT Studio",
  },
  {
    id: "crop",
    name: "Crop",
    icon: Crop,
    tip: "Crop, rotate, flip and straighten",
  },
  {
    id: "enhance",
    name: "Enhance",
    icon: Sparkles,
    tip: "Fast or AI 2x upscaling",
  },
] as const;
const searchable = [
  ["Enhance / Upscale / Super resolution", "enhance"],
  ["Light / Exposure / Contrast / Highlights / Shadows", "edit"],
  ["Color / Temperature / Tint / Saturation", "edit"],
  ["Color Mixer / HSL / Hue", "edit"],
  ["Color Grading / Midtones", "edit"],
  ["Effects / Clarity / Vignette / Grain", "edit"],
  ["Detail / Sharpness / Noise", "edit"],
  ["Tone Curve", "edit"],
  ["Smart Masks / Sky / Person / Skin / Object / Brush / Erase", "ai"],
  ["Reference / Match / Color DNA", "dna"],
  ["Presets / Favorites / Palettes / LUT", "looks"],
  ["Crop / Aspect ratio / Rotate / Flip / Straighten", "crop"],
] as const;
export default function App() {
  usePreferences(); // Re-render presentation text without remounting the editor.
  const [settings, setSettings] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const e = useEditor();
  const [target, setTarget] = useState<Photo | null>(null),
    [reference, setReference] = useState<Photo | null>(null),
    [source, setSource] = useState<Analysis | null>(null),
    [refStats, setRefStats] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState({ target: false, reference: false }),
    [error, setError] = useState(""),
    [active, setActive] = useState<Workspace>("edit"),
    [advanced, setAdvanced] = useState(false),
    [search, setSearch] = useState(""),
    [drawer, setDrawer] = useState(false),
    [history, setHistory] = useState(false),
    [compare, setCompare] = useState(true),
    [enhancing, setEnhancing] = useState(false),
    [exportTab, setExportTab] = useState<"image" | "lut" | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [install, setInstall] = useState<InstallPrompt | null>(null);
  const [selected, setSelected] = useState<string | null>(null),
    [maskEditing, setMaskEditing] = useState(false),
    [erase, setErase] = useState(false),
    [radius, setRadius] = useState(0.05),
    [overlay, setOverlay] = useState(45),
    [cropEditing, setCropEditing] = useState(false),
    [draft, setDraft] = useState({ ...defaultGeometry }),
    [aspect, setAspect] = useState("free");
  useEffect(() => {
    if (!drawer) setPanelExpanded(false);
  }, [drawer]);
  const ids = useRef({ target: 0, reference: 0 }),
    photos = useRef({ target, reference });
  photos.current = { target, reference };
  const upload = useRef<HTMLInputElement>(null);
  const tools = {
    selected,
    setSelected,
    editing: maskEditing,
    setEditing: (value: boolean) => {
      setMaskEditing(value);
      if (value) setDrawer(false);
    },
    erase,
    setErase,
    radius,
    setRadius,
    overlay,
    setOverlay,
  };
  const document = useMemo<DocumentState>(
    () => ({
      params: e.params,
      style: e.style,
      geometry: e.geometry,
      masks: e.masks,
      upscale: e.upscale,
      enhanced: e.enhanced,
    }),
    [e.params, e.style, e.geometry, e.masks, e.upscale, e.enhanced],
  );
  const previewDocument = useMemo(
    () => ({
      ...document,
      enhanced: maskEditing || cropEditing ? undefined : document.enhanced,
      geometry:
        maskEditing || cropEditing ? defaultGeometry : document.geometry,
    }),
    [document, maskEditing, cropEditing],
  );
  const onError = useCallback((message: string) => setError(message), []);
  const { result, busy } = usePreview(
    target,
    source,
    refStats,
    previewDocument,
    onError,
  );
  useEffect(() => {
    const onlineChange = () => setOnline(navigator.onLine),
      prompt = (ev: Event) => {
        ev.preventDefault();
        setInstall(ev as InstallPrompt);
      };
    window.addEventListener("online", onlineChange);
    window.addEventListener("offline", onlineChange);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("online", onlineChange);
      window.removeEventListener("offline", onlineChange);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    const keys = (ev: KeyboardEvent) => {
      if (
        ev.target instanceof HTMLElement &&
        (ev.target.closest("input,textarea,select,dialog") ||
          ev.target.isContentEditable)
      )
        return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) e.redo();
        else e.undo();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        e.redo();
      } else if (ev.key.toLowerCase() === "b") setCompare((v) => !v);
      else if (ev.key === "Escape") {
        setDrawer(false);
        setMaskEditing(false);
        setCropEditing(false);
      } else if (ev.key === "?") setHistory((v) => !v);
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [e.undo, e.redo]);
  useEffect(
    () => () => {
      ids.current.target++;
      ids.current.reference++;
      Object.values(photos.current).forEach(
        (p) => p && URL.revokeObjectURL(p.url),
      );
    },
    [],
  );
  const load = async (file: File, kind: "target" | "reference") => {
    const id = ++ids.current[kind];
    setLoading((s) => ({ ...s, [kind]: true }));
    setError("");
    let photo: Photo | null = null;
    try {
      photo = await decode(file);
      const stats = await job<Analysis>({
        kind: "analyze",
        pixels: photo.preview.data,
      }).promise;
      if (id !== ids.current[kind]) {
        URL.revokeObjectURL(photo.url);
        return;
      }
      const old = photos.current[kind];
      if (old) URL.revokeObjectURL(old.url);
      if (kind === "target") {
        setTarget(photo);
        setSource(stats);
        e.newImage();
        setSelected(null);
        setMaskEditing(false);
        setCropEditing(false);
        setDrawer(false);
        setDraft({ ...defaultGeometry });
      } else {
        setReference(photo);
        useEditor
          .getState()
          .commit({ enhanced: undefined, upscale: "none" }, "Change reference");
        setRefStats(stats);
      }
    } catch (err) {
      if (photo) URL.revokeObjectURL(photo.url);
      if (id === ids.current[kind])
        setError(err instanceof Error ? err.message : "Image loading failed.");
    } finally {
      if (id === ids.current[kind])
        setLoading((s) => ({ ...s, [kind]: false }));
    }
  };
  function navigate(workspace: Workspace) {
    setPanelExpanded(false);
    if (active === workspace) setDrawer((v) => !v);
    else setDrawer(true);
    setActive(workspace);
    setMaskEditing(false);
    setCropEditing(false);
    if (workspace === "crop") {
      setDraft({ ...e.geometry });
      setCropEditing(true);
    }
  }
  function newSession() {
    ids.current.target++;
    ids.current.reference++;
    Object.values(photos.current).forEach(
      (p) => p && URL.revokeObjectURL(p.url),
    );
    photos.current = { target: null, reference: null };
    setTarget(null);
    setReference(null);
    setSource(null);
    setRefStats(null);
    setSelected(null);
    setMaskEditing(false);
    setCropEditing(false);
    setLoading({ target: false, reference: false });
    e.newImage();
    setError("");
    setExportTab(null);
    setSearch("");
  }
  return (
    <div className="studio">
      <header className="topbar">
        <button
          className="studio-brand"
          title={t("Lumerix Studio")}
          onClick={() => {
            setActive("edit");
            setDrawer(false);
          }}
        >
          <span>
            <img src="/icon.svg" alt="" width="34" height="34" />
          </span>
          Lumerix
          <small>STUDIO</small>
        </button>
        <div className="session-name">
          {t(target ? target.name : "A fresh perspective")}
          <span>
            {t(target ? "Non-destructive editing" : "Private. Local. Yours.")}
          </span>
        </div>
        <div className="top-actions">
          <button title={t("Settings")} aria-label={t("Settings")} aria-haspopup="dialog" onClick={() => setSettings(true)}><Settings size={18} /></button>
          <button
            title={t("Undo (Ctrl/Cmd Z)")}
            aria-label={t("Undo")}
            disabled={!e.past.length}
            onClick={e.undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            title={t("Redo (Ctrl/Cmd Shift Z)")}
            aria-label={t("Redo")}
            disabled={!e.future.length}
            onClick={e.redo}
          >
            <Redo2 size={18} />
          </button>
          <button
            title={t("History & shortcuts (?)")}
            aria-label={t("History")}
            className={history ? "active" : ""}
            onClick={() => setHistory(!history)}
          >
            <History size={18} />
          </button>
          <button
            title={t("New session")}
            className="new-session"
            aria-label={t("New session")}
            onClick={newSession}
          >
            <FolderPlus size={18} />
          </button>
          {install && (
            <button
              className="install-app"
              onClick={async () => {
                await install.prompt();
                setInstall(null);
              }}
            >{t("Install")}</button>
          )}
          <button
            className="button primary"
            aria-label={t("Export")}
            disabled={!target || !source || loading.target || enhancing}
            onClick={() => setExportTab("image")}
          >
            <Download size={15} />
            <span>{t("Export")}</span>
          </button>
        </div>
      </header>
      {error && (
        <div className="studio-error" role="alert">
          <span>{errorText(error)}</span>
          <button title={t("Dismiss error")} onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {history && (
        <div className="history-popover">
          <h3>{t("Session history")}</h3>
          <p>{t("Ctrl/Cmd Z · undo")}<br />{t("Ctrl/Cmd Shift Z · redo")}<br />{t("B · before/after · F · fit")}<br />{t("Escape · leave selection")}</p>
          <ol>
            {e.past.map((entry, i) => (
              <li key={i}>{t(entry.label)}</li>
            ))}
          </ol>
          {!e.past.length && <p>{t("Your next edit will appear here.")}</p>}
        </div>
      )}
      <main
        className="studio-layout"
        data-panel={
          !drawer ? "collapsed" : panelExpanded ? "expanded" : "normal"
        }
      >
        <nav className="workspace-nav" aria-label={t("Editing workspaces")}>
          {workspaces.map(({ id, name, icon: Icon, tip }) => (
            <button
              key={id}
              title={t(tip)}
              aria-pressed={active === id}
              className={active === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={21} />
              <span>{t(name)}</span>
            </button>
          ))}
          <div className="nav-bottom">
            <ShieldCheck size={18} />
            <span>{t("ON DEVICE")}</span>
          </div>
        </nav>
        <Stage
          photo={target}
          result={result}
          busy={busy || loading.target}
          compare={compare}
          setCompare={setCompare}
          onLoad={(f) => load(f, "target")}
          mask={e.masks.find((m) => m.id === selected)}
          tools={tools}
          onMaskCommit={(data) =>
            e.setMasks(
              e.masks.map((m) => (m.id === selected ? { ...m, data } : m)),
              erase ? "Erase mask stroke" : "Brush mask stroke",
            )
          }
          crop={draft}
          cropEditing={cropEditing}
          onCrop={setDraft}
          aspect={aspect}
          onDone={() => {
            if (cropEditing) {
              e.setGeometry(draft);
              setCropEditing(false);
            }
            setMaskEditing(false);
            setDrawer(true);
          }}
        />
        <aside className={`sidepanel ${drawer ? "drawer-open" : ""}`}>
          <PanelHandle
            state={
              !drawer ? "collapsed" : panelExpanded ? "expanded" : "normal"
            }
            onChange={(state: PanelState) => {
              setDrawer(state !== "collapsed");
              setPanelExpanded(state === "expanded");
            }}
          />
          <div className="side-heading">
            <div>
              <span className="eyebrow">{t("MAKE IT YOURS")}</span>
              <h2>{t(workspaces.find((w) => w.id === active)?.name)}</h2>
            </div>
            <button
              className="mobile-only"
              title={t("Close tools")}
              onClick={() => setDrawer(false)}
            >
              <ChevronDown size={20} />
            </button>
            <select
              aria-label={t("Control density")}
              value={advanced ? "advanced" : "beginner"}
              onChange={(v) => setAdvanced(v.target.value === "advanced")}
            >
              <option value="beginner">{t("Beginner")}</option>
              <option value="advanced">{t("Advanced")}</option>
            </select>
          </div>
          <div className="tool-search">
            <Search size={14} />
            <input
              aria-label={t("Search editing tools")}
              placeholder={t("Find a tool…")}
              value={search}
              onChange={(v) => setSearch(v.target.value)}
            />
            {search && (
              <button title={t("Clear search")} onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>
          <div className="tool-scroll">
            {search && (
              <div className="search-results">
                {searchable
                  .filter(([name]) =>
                    matchesTool(name, search),
                  )
                  .map(([name, id]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setActive(id);
                        setAdvanced(true);
                        setSearch(
                          id === "edit" ? name.split("/")[0].trim() : "",
                        );
                        if (id === "crop") {
                          setDraft({ ...e.geometry });
                          setCropEditing(true);
                        }
                      }}
                    >
                      {toolText(name)}
                    </button>
                  ))}
                {!searchable.some(([name]) =>
                  matchesTool(name, search),
                ) && (
                  <p className="help">{t("No tools match. Try “sky”, “curve” or “exposure”.")}</p>
                )}
              </div>
            )}
            {active === "edit" && (
              <>
                <details className="source-disclosure">
                  <summary>
                    <Layers size={14} />
                    {t(target ? "Source photograph" : "Open your photograph")}
                  </summary>
                  <Upload
                    label="Target"
                    photo={target}
                    busy={loading.target}
                    onLoad={(f) => load(f, "target")}
                    onRemove={() => {
                      ids.current.target++;
                      if (target) URL.revokeObjectURL(target.url);
                      photos.current.target = null;
                      setTarget(null);
                      setSource(null);
                      setLoading((s) => ({ ...s, target: false }));
                      e.newImage();
                      setSelected(null);
                      setMaskEditing(false);
                      setCropEditing(false);
                      setDraft({ ...defaultGeometry });
                    }}
                  />
                </details>
                <EditPanel advanced={advanced} search={search} />
              </>
            )}
            {active === "enhance" && (
              <EnhancePanel
                photo={target}
                source={source}
                reference={refStats}
                document={document}
                rendering={busy || loading.target}
                onProcessing={setEnhancing}
              />
            )}
            {active === "dna" && (
              <DnaPanel
                reference={reference}
                analysis={refStats}
                busy={loading.reference}
                onLoad={(f) => load(f, "reference")}
                onRemove={() => {
                  ids.current.reference++;
                  if (reference) URL.revokeObjectURL(reference.url);
                  setReference(null);
                  useEditor
                    .getState()
                    .commit(
                      { enhanced: undefined, upscale: "none" },
                      "Remove reference",
                    );
                  setRefStats(null);
                  setLoading((s) => ({ ...s, reference: false }));
                }}
                advanced={advanced}
              />
            )}
            <div hidden={active !== "ai"}>
              <MaskPanel
                active={active === "ai" && !loading.target}
                photo={target}
                tools={tools}
                onError={onError}
              />
            </div>
            {active === "looks" && (
              <LooksPanel
                photo={target}
                analysis={source}
                reference={refStats}
                onError={onError}
                onLut={() => setExportTab("lut")}
              />
            )}{" "}
            {active === "crop" && (
              <CropPanel
                draft={draft}
                setDraft={setDraft}
                editing={cropEditing}
                setEditing={(v) => {
                  setCropEditing(v);
                  if (v) setDraft({ ...e.geometry });
                }}
                onApply={() => {
                  e.setGeometry(draft);
                  setCropEditing(false);
                }}
                aspect={aspect}
                setAspect={setAspect}
              />
            )}
          </div>
        </aside>
      </main>
      <footer className="studio-status">
        <span>
          <i className={busy ? "working" : ""} />
          {t(enhancing
            ? "Upscaling"
            : busy
              ? "Developing"
              : loading.target || loading.reference
                ? "Reading image"
                : "Ready")}
        </span>
        <span>
          {t(target
            ? `${e.masks.length} masks · ${e.past.length} reversible edits`
            : "Your photograph is the starting point.")}
        </span>
        <span>
          <ShieldCheck size={11} />
          {t(online ? "Local processing" : "Offline mode")}
        </span>
      </footer>
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
      {target && source && exportTab && (
        <ExportDialog
          photo={target}
          source={source}
          reference={refStats}
          document={document}
          initialTab={exportTab}
          onClose={() => setExportTab(null)}
        />
      )}
      <input
        ref={upload}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
      />
    </div>
  );
}
