import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { errorText, matchesTool, t, translate } from "./i18n";
import { messages } from "./translations";
import { languages, usePreferences, type Language } from "./preferences";
import Upload from "./components/Upload";
import SettingsDialog from "./components/SettingsDialog";
import EditPanel from "./components/EditPanel";
import CropPanel from "./components/CropPanel";
import { defaultGeometry } from "./editor/types";

afterEach(() => usePreferences.setState({ language: "en", theme: "dark" }));
describe("six-language interface", () => {
  it("has five complete translations per English key with matching placeholders", () => {
    for (const [key, values] of Object.entries(messages)) {
      expect(values, key).toHaveLength(5);
      for (const value of values) {
        expect(value.trim().length, key).toBeGreaterThan(0);
        expect(value.match(/\{\d+\}/g)?.sort() ?? [], key).toEqual(key.match(/\{\d+\}/g)?.sort() ?? []);
      }
    }
  });
  it("covers every static UI translation and control label", () => {
    const files = ["src/App.tsx", ...readdirSync("src/components").filter(f => f.endsWith(".tsx") && !f.includes(".test.")).map(f => `src/components/${f}`)];
    const allowed = new Set(["Lumerix Studio", "JPEG", "PNG"]), missing = new Set<string>();
    for (const file of files) {
      const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        let text: string | undefined;
        if (ts.isCallExpression(node) && node.expression.getText(tree) === "t" && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) text = node.arguments[0].text;
        if (ts.isJsxAttribute(node) && ["label", "title", "hint"].includes(node.name.getText(tree)) && node.initializer && ts.isStringLiteral(node.initializer)) text = node.initializer.text;
        if (text && !messages[text.trim()] && !allowed.has(text)) missing.add(text);
        ts.forEachChild(node, visit);
      } visit(tree);
    }
    expect([...missing]).toEqual([]);
  });
  it("translates runtime AI messages, controls and localized search", () => {
    usePreferences.setState({ language: "fr" });
    expect(t("Reset Exposure")).toBe("Réinitialiser : Exposition");
    expect(t("Loading semantic model (GPU)...")).toBe("Chargement du modèle sémantique (GPU)…");
    expect(t("Processing 37%")).toBe("Traitement 37 %");
    expect(matchesTool("Light / Exposure / Contrast", "exposition")).toBe(true);
    expect(matchesTool("Color Grading Midtones Hue", "tons moyens")).toBe(true);
    expect(errorText("Portrait model returned no mask Retry the selection or use Brush.")).not.toContain("returned no mask");
    expect(errorText("ONNX E123")).toContain("Détails techniques : ONNX E123");
  });
  it("preserves user names inside action labels and unknown strings", () => {
    expect(translate("Rename Light", "fr")).toBe("Renommer : Light");
    expect(translate("Vacation.png", "ru")).toBe("Vacation.png");
    expect(t(50)).toBe(50);
  });
  it.each(Object.keys(languages) as Language[])("renders settings and editing controls in %s", language => {
    usePreferences.setState({ language });
    const settings = renderToStaticMarkup(<SettingsDialog onClose={() => {}} />);
    expect(settings).toContain(t("Settings"));
    expect(settings.match(/<option/g)).toHaveLength(6);
    const upload = renderToStaticMarkup(<Upload label="Reference" photo={null} busy={false} onLoad={() => {}} />);
    expect(upload).toContain(t("Choose Reference"));
    const edit = renderToStaticMarkup(<EditPanel advanced search="" />);
    expect(edit).toContain(t("Exposure"));
    expect(edit).toContain(t("Reset global adjustments"));
    const crop = renderToStaticMarkup(<CropPanel draft={defaultGeometry} setDraft={() => {}} editing setEditing={() => {}} onApply={() => {}} aspect="free" setAspect={() => {}} />);
    expect(crop).toContain(t("Flip horizontal"));
  });
});
