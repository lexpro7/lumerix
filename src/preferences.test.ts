import { afterEach, describe, expect, it, vi } from "vitest";
import { applyPreferences, preferenceKey, readPreferences, usePreferences } from "./preferences";

afterEach(() => { vi.unstubAllGlobals(); usePreferences.setState({ theme: "dark", language: "en", storageFailed: false }); });
describe("interface preferences", () => {
  it("defaults to English and the original dark theme", () => {
    expect(readPreferences()).toEqual({ language: "en", theme: "dark" });
  });
  it("restores valid preferences and rejects malformed values", () => {
    expect(readPreferences({ getItem: () => '{"language":"ru","theme":"light"}' })).toEqual({ language: "ru", theme: "light" });
    for (const value of ['null', '{', '{"language":"toString","theme":"pink"}', '[]']) expect(readPreferences({ getItem: () => value })).toEqual({ language: "en", theme: "dark" });
    expect(readPreferences({ getItem: () => { throw new Error("blocked"); } })).toEqual({ language: "en", theme: "dark" });
  });
  it("persists changes without touching existing editor storage", () => {
    const setItem = vi.fn(); vi.stubGlobal("localStorage", { setItem });
    usePreferences.getState().setPreference({ language: "fr" });
    usePreferences.getState().setPreference({ theme: "light" });
    expect(setItem).toHaveBeenLastCalledWith(preferenceKey, '{"language":"fr","theme":"light"}');
    expect(setItem.mock.calls.every(([key]) => key === preferenceKey)).toBe(true);
  });
  it("keeps changes usable when storage is blocked", () => {
    vi.stubGlobal("localStorage", { setItem() { throw new Error("quota"); } });
    usePreferences.getState().setPreference({ language: "es", theme: "light" });
    expect(usePreferences.getState()).toMatchObject({ language: "es", theme: "light", storageFailed: true });
  });
  it("sets document language, theme, native control scheme and browser chrome", () => {
    const root = { dataset: {}, lang: "", style: {} }, setAttribute = vi.fn();
    vi.stubGlobal("document", { documentElement: root, querySelector: () => ({ setAttribute }) });
    usePreferences.setState({ language: "de", theme: "light" }); applyPreferences();
    expect(root).toMatchObject({ dataset: { theme: "light" }, lang: "de", style: { colorScheme: "light" } });
    expect(setAttribute).toHaveBeenCalledWith("content", "#f4f2f8");
  });
});
