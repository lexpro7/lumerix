import { useEffect, useRef } from "react";
import { X, Moon, Sun } from "lucide-react";
import { languages, usePreferences, type Language } from "../preferences";
import { t } from "../i18n";

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { theme, language, setPreference, storageFailed } = usePreferences();
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="studio-dialog settings-dialog" aria-labelledby="settings-title" onCancel={onClose}>
    <div className="dialog-top"><h2 id="settings-title">{t("Settings")}</h2><button onClick={onClose} aria-label={t("Close settings")}><X size={20} /></button></div>
    <fieldset><legend>{t("Appearance")}</legend><div className="segmented">
      <button aria-pressed={theme === "dark"} className={theme === "dark" ? "active" : ""} onClick={() => setPreference({ theme: "dark" })}><Moon size={17} />{t("Dark")}</button>
      <button aria-pressed={theme === "light"} className={theme === "light" ? "active" : ""} onClick={() => setPreference({ theme: "light" })}><Sun size={17} />{t("Light theme")}</button>
    </div></fieldset>
    <label className="field-label">{t("Interface language")}<select value={language} onChange={e => setPreference({ language: e.target.value as Language })}>
      {Object.entries(languages).map(([code, name]) => <option key={code} value={code} lang={code}>{name}</option>)}
    </select></label>
    <p className="help" role="status">{t(storageFailed ? "Preferences could not be saved. They will apply for this session." : "Preferences are saved on this device. Changes apply instantly.")}</p>
  </dialog>;
}
