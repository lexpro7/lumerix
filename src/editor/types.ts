import { defaults, type Params } from "../processing/adjustments";
export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  straighten: number;
  flipX: boolean;
  flipY: boolean;
}
export const defaultGeometry: Geometry = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  rotation: 0,
  straighten: 0,
  flipX: false,
  flipY: false,
};
export interface Mixer {
  hue: number;
  saturation: number;
  lightness: number;
}
export interface Grade {
  hue: number;
  amount: number;
}
export interface Style {
  mixer: Mixer[];
  grading: Grade[];
  curve: number[];
  palette: string[];
  paletteStrength: number;
  method: "classic" | "perceptual";
  toneStrength: number;
  chromaStrength: number;
  skinProtection: number;
  skinMaskId: string | null;
  lookStrength: number;
}
export const defaultStyle = (): Style => ({
  mixer: Array.from({ length: 8 }, () => ({
    hue: 0,
    saturation: 0,
    lightness: 0,
  })),
  grading: Array.from({ length: 3 }, () => ({ hue: 30, amount: 0 })),
  curve: [0, 0.25, 0.5, 0.75, 1],
  palette: [],
  paletteStrength: 0,
  method: "classic",
  toneStrength: 70,
  chromaStrength: 70,
  skinProtection: 0,
  skinMaskId: null,
  lookStrength: 100,
});
export interface LocalParams {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  warmth: number;
  tint: number;
  saturation: number;
  clarity: number;
  sharpness: number;
}
export const localDefaults: LocalParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  warmth: 0,
  tint: 0,
  saturation: 0,
  clarity: 0,
  sharpness: 0,
};
export interface Mask {
  id: string;
  name: string;
  kind: "manual" | "sky" | "person" | "skin" | "object";
  width: number;
  height: number;
  data: Uint8ClampedArray;
  enabled: boolean;
  invert: boolean;
  feather: number;
  edge: number;
  opacity: number;
  adjustments: LocalParams;
}
export interface DocumentState {
  params: Params;
  style: Style;
  geometry: Geometry;
  masks: Mask[];
}
export const freshDocument = (): DocumentState => ({
  params: { ...defaults },
  style: defaultStyle(),
  geometry: { ...defaultGeometry },
  masks: [],
});
export type Workspace = "edit" | "ai" | "dna" | "looks" | "crop";
export function normalizeStyle(style?: Partial<Style>): Style {
  const base = defaultStyle();
  return {
    ...base,
    ...style,
    mixer: style?.mixer?.length === 8 ? style.mixer : base.mixer,
    grading: style?.grading?.length === 3 ? style.grading : base.grading,
    curve: style?.curve?.length === 5 ? style.curve : base.curve,
  };
}
