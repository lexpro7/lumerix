import { create } from "zustand";

export const languages = { en: "English", ru: "Русский", fr: "Français", de: "Deutsch", it: "Italiano", es: "Español" } as const;
export type Language = keyof typeof languages;
export type Theme = "dark" | "light";
export const preferenceKey = "lumerix-preferences";
export function readPreferences(storage?: Pick<Storage, "getItem">): { language: Language; theme: Theme } {
  try {
    const value = JSON.parse(storage?.getItem(preferenceKey) ?? "null");
    return { language: value && Object.hasOwn(languages, value.language) ? value.language : "en", theme: value?.theme === "light" ? "light" : "dark" };
  } catch { return { language: "en", theme: "dark" }; }
}
function initialPreferences() {
  try { return readPreferences(globalThis.localStorage); }
  catch { return readPreferences(); }
}
export const usePreferences = create<{
  language: Language; theme: Theme; storageFailed: boolean;
  setPreference: (patch: Partial<{ language: Language; theme: Theme }>) => void;
}>((set, get) => ({
  ...initialPreferences(), storageFailed: false,
  setPreference(patch) {
    const next = { language: patch.language ?? get().language, theme: patch.theme ?? get().theme };
    let storageFailed = false;
    try { localStorage.setItem(preferenceKey, JSON.stringify(next)); }
    catch { storageFailed = true; }
    set({ ...next, storageFailed });
  },
}));

export function applyPreferences() {
  const { theme, language } = usePreferences.getState();
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = language;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#141416" : "#f4f2f8");
}
