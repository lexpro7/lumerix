import { job } from "./client";
import type { Photo } from "./decode";
import type { Analysis } from "./analysis";
import type { Params } from "./adjustments";
import type { DocumentState } from "../editor/types";
export function exportPhoto(
  photo: Photo,
  source: Analysis,
  reference: Analysis | null,
  params: Params,
  format: string,
  quality: number,
  onProgress: (v: number) => void,
  document?: DocumentState,
) {
  return job<Blob>(
    { file: photo.file, source, reference, params, format, quality, document },
    onProgress,
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
