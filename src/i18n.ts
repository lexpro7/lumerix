import { usePreferences, type Language } from "./preferences";
import { messages } from "./translations";

const locales: Language[] = ["ru", "fr", "de", "it", "es"];
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const patterns = Object.keys(messages).filter(key => key.includes("{0}")).map(key => ({
  key,
  expression: new RegExp("^" + key.split(/\{\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(.+?)") + "$"),
}));
/** Translate only presentation text. IDs, persisted names and worker messages remain stable. */
export function translate(text: string, language: Language): string {
  if (language === "en" || !text.trim()) return text;
  const key = normalize(text), index = locales.indexOf(language);
  const aliases: Record<string, string> = { exposure: "Exposure", contrast: "Contrast", highlights: "Highlights", shadows: "Shadows", saturation: "Saturation", warmth: "Temperature", tint: "Tint", clarity: "Clarity", vignette: "Vignette", grain: "Grain", sharpness: "Sharpness", noise: "Noise smoothing", strength: "Color transfer strength" };
  if (Object.hasOwn(aliases, key)) return translate(aliases[key], language);
  const direct = messages[key];
  let result = direct?.[index];
  if (!result) {
    for (const pattern of patterns) {
      const match = pattern.expression.exec(key);
      if (match) {
        result = messages[pattern.key][index].replace(/\{(\d+)\}/g, (_, n) => {
          const value = match[Number(n) + 1];
          // User-authored preset/palette names must never be translated.
          return /^(Apply|Favorite|Rename|Delete) /.test(pattern.key) ? value : translate(value, language);
        });
        break;
      }
    }
  }
  return result ? text.replace(text.trim(), result) : text;
}
export function t<T>(value: T): T {
  return (typeof value === "string" ? translate(value, usePreferences.getState().language) : value) as T;
}
export function toolText(value: string): string { return value.split(" / ").map(t).join(" / "); }
export function matchesTool(value: string, query: string): boolean {
  return [value, toolText(value), value.split(" ").map(t).join(" ")].some(text => text.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
}
/** External runtime diagnostics stay verbatim after a localized explanation. */
export function errorText(value: string): string {
  const retry = " Retry the selection or use Brush.";
  if (value.endsWith(retry)) return `${errorText(value.slice(0, -retry.length))} ${t(retry.trim())}`;
  const translated = t(value);
  if (!value || translated !== value || usePreferences.getState().language === "en") return translated;
  return `${t("The operation failed. Please try again. Technical details:")} ${value}`;
}
