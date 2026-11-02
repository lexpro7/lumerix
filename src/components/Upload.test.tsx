import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Upload from "./Upload";
import type { Photo } from "../processing/decode";

describe("compact mobile uploads", () => {
  it.each([["Target", "Choose Photo"], ["Reference", "Choose Reference"]])("offers the %s picker without removing desktop drop markup", (label, text) => {
    const html = renderToStaticMarkup(<Upload label={label} photo={null} busy={false} onLoad={() => {}} />);
    expect(html).toContain(text);
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).toContain(`Drop your ${label.toLowerCase()} here`);
    expect(html).not.toContain(`Remove ${label.toLowerCase()} image`);
  });
  it("shows thumbnail and named replace/remove controls for the selected image", () => {
    const photo = { url: "blob:test", name: "portrait.png", width: 800, height: 1200 } as Photo;
    const html = renderToStaticMarkup(<Upload label="Target" photo={photo} busy={false} onLoad={() => {}} onRemove={() => {}} />);
    expect(html).toContain('src="blob:test"');
    expect(html).toContain('aria-label="Replace target image"');
    expect(html).toContain('aria-label="Remove target image"');
  });
  it("disables upload actions and announces decoding while busy", () => {
    const html = renderToStaticMarkup(<Upload label="Reference" photo={null} busy onLoad={() => {}} />);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain('role="status"');
  });
});
