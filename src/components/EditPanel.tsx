import { useState } from "react";
import { useEditor } from "../store";
import { defaults, type Params } from "../processing/adjustments";
import { defaultStyle } from "../editor/types";
import { Slider, Group } from "./Controls";
export const basicControls: {
  key: keyof Params;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}[] = [
  { key: "exposure", label: "Exposure", min: -3, max: 3, step: 0.05 },
  { key: "contrast", label: "Contrast" },
  { key: "highlights", label: "Highlights" },
  { key: "shadows", label: "Shadows" },
  { key: "saturation", label: "Saturation" },
  { key: "warmth", label: "Temperature" },
  { key: "tint", label: "Tint" },
  { key: "clarity", label: "Clarity" },
  { key: "vignette", label: "Vignette", min: 0 },
  { key: "grain", label: "Grain", min: 0 },
  { key: "sharpness", label: "Sharpness", min: 0 },
  { key: "noise", label: "Noise smoothing", min: 0 },
];
export default function EditPanel({
  advanced,
  search,
}: {
  advanced: boolean;
  search: string;
}) {
  const e = useEditor(),
    [channel, setChannel] = useState(0);
  const matches = (title: string) =>
    !search || title.toLowerCase().includes(search.toLowerCase());
  const sliders = (keys: string[]) =>
    basicControls
      .filter((c) => keys.includes(c.key))
      .map((c) => (
        <Slider
          key={c.key}
          label={c.label}
          min={c.min}
          max={c.max}
          step={c.step}
          value={e.params[c.key]}
          onChange={(v) => e.set(c.key, v)}
        />
      ));
  const reset = (keys: (keyof Params)[]) =>
    e.commit(
      {
        params: {
          ...e.params,
          ...Object.fromEntries(keys.map((k) => [k, defaults[k]])),
        },
      },
      "Reset group",
    );
  return (
    <>
      <p className="help">
        Start with the light. Every slider is live, and every edit is
        reversible.
      </p>
      {matches("Light Exposure Contrast Highlights Shadows") && (
        <Group
          title="Light"
          open
          onReset={() =>
            reset(["exposure", "contrast", "highlights", "shadows"])
          }
        >
          {sliders(["exposure", "contrast", "highlights", "shadows"])}
        </Group>
      )}
      {matches("Color Saturation Temperature Tint") && (
        <Group
          title="Color"
          open
          onReset={() => reset(["saturation", "warmth", "tint"])}
        >
          {sliders(["saturation", "warmth", ...(advanced ? ["tint"] : [])])}
        </Group>
      )}
      {(advanced || search) && (
        <>
          {matches(
            "Color Mixer HSL Hue Red Orange Yellow Green Aqua Blue Purple Magenta",
          ) && (
            <Group
              title="Color Mixer · HSL"
              open={!!search}
              onReset={() => e.updateStyle({ mixer: defaultStyle().mixer })}
            >
              <p className="help">
                Change one color family without changing the others.
              </p>
              <div className="color-families">
                {[
                  "#ef6969",
                  "#eda765",
                  "#e9d469",
                  "#70b881",
                  "#62c7c7",
                  "#6d9bdf",
                  "#a78bdd",
                  "#cf85b3",
                ].map((color, i) => (
                  <button
                    key={color}
                    title={
                      [
                        "Red",
                        "Orange",
                        "Yellow",
                        "Green",
                        "Aqua",
                        "Blue",
                        "Purple",
                        "Magenta",
                      ][i]
                    }
                    aria-label={`Edit ${["Red", "Orange", "Yellow", "Green", "Aqua", "Blue", "Purple", "Magenta"][i]}`}
                    aria-pressed={channel === i}
                    style={{ background: color }}
                    onClick={() => setChannel(i)}
                  />
                ))}
              </div>
              {(["hue", "saturation", "lightness"] as const).map((k) => (
                <Slider
                  key={k}
                  label={`${k[0].toUpperCase() + k.slice(1)} · selected color`}
                  value={e.style.mixer[channel][k]}
                  min={k === "hue" ? -45 : -100}
                  max={k === "hue" ? 45 : 100}
                  onChange={(v) =>
                    e.updateStyle({
                      mixer: e.style.mixer.map((m, i) =>
                        i === channel ? { ...m, [k]: v } : m,
                      ),
                    })
                  }
                />
              ))}
            </Group>
          )}
          {matches("Color Grading Midtones Hue") && (
            <Group
              title="Color Grading"
              open={!!search}
              onReset={() => e.updateStyle({ grading: defaultStyle().grading })}
            >
              {["Shadows", "Midtones", "Highlights"].map((label, i) => (
                <div key={label}>
                  <Slider
                    label={`${label} hue`}
                    min={0}
                    max={360}
                    reset={30}
                    value={e.style.grading[i].hue}
                    onChange={(v) =>
                      e.updateStyle({
                        grading: e.style.grading.map((g, j) =>
                          i === j ? { ...g, hue: v } : g,
                        ),
                      })
                    }
                  />
                  <Slider
                    label={`${label} color amount`}
                    min={0}
                    value={e.style.grading[i].amount}
                    onChange={(v) =>
                      e.updateStyle({
                        grading: e.style.grading.map((g, j) =>
                          i === j ? { ...g, amount: v } : g,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </Group>
          )}
          {matches("Effects Clarity Grain Vignette") && (
            <Group
              title="Effects"
              open={!!search}
              onReset={() => reset(["clarity", "grain", "vignette"])}
            >
              {sliders(["clarity", "grain", "vignette"])}
            </Group>
          )}
          {matches("Detail Sharpness Noise smoothing") && (
            <Group
              title="Detail"
              open={!!search}
              onReset={() => reset(["sharpness", "noise"])}
            >
              {sliders(["sharpness", "noise"])}
              <p className="help">
                Inspect at 100% for fine detail. Noise smoothing is a light
                luminance filter.
              </p>
            </Group>
          )}
          {matches("Tone Curve Black point White point") && (
            <Group
              title="Tone Curve"
              open={!!search}
              onReset={() => e.updateStyle({ curve: defaultStyle().curve })}
            >
              <svg
                viewBox="0 0 200 110"
                className="curve-chart"
                aria-label="RGB tone curve"
              >
                <path d="M0 110 L200 0" stroke="#555" fill="none" />
                <polyline
                  points={e.style.curve
                    .map((v, i) => `${i * 50},${110 - v * 110}`)
                    .join(" ")}
                  stroke="#c5b3ff"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              {[
                "Black point",
                "Lower midtones",
                "Midtones",
                "Upper midtones",
                "White point",
              ].map((label, i) => (
                <Slider
                  key={label}
                  label={label}
                  min={i ? e.style.curve[i - 1] * 100 : 0}
                  max={i < 4 ? e.style.curve[i + 1] * 100 : 100}
                  reset={i * 25}
                  value={e.style.curve[i] * 100}
                  onChange={(v) =>
                    e.updateStyle({
                      curve: e.style.curve.map((x, j) =>
                        i === j
                          ? Math.max(
                              i ? e.style.curve[i - 1] : 0,
                              Math.min(
                                i < 4 ? e.style.curve[i + 1] : 1,
                                v / 100,
                              ),
                            )
                          : x,
                      ),
                    })
                  }
                />
              ))}
            </Group>
          )}
        </>
      )}
      <button className="button secondary full" onClick={e.reset}>
        Reset global adjustments
      </button>
      {!advanced && (
        <p className="help">
          Switch to Advanced for the Color Mixer, Color Grading, Effects, Detail
          and Tone Curve.
        </p>
      )}
    </>
  );
}
