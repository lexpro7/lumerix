import { useEffect, useState } from "react";
import type { Photo } from "../processing/decode";
import type { Analysis } from "../processing/analysis";
import type { DocumentState } from "./types";
import { job } from "../processing/client";
export interface RenderResult {
  pixels: Uint8ClampedArray;
  before: Uint8ClampedArray;
  width: number;
  height: number;
}
export function usePreview(
  photo: Photo | null,
  source: Analysis | null,
  reference: Analysis | null,
  document: DocumentState,
  onError: (s: string) => void,
) {
  const [result, setResult] = useState<RenderResult | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setResult(null);
  }, [photo]);
  useEffect(() => {
    if (!photo || !source) {
      setBusy(false);
      return;
    }
    let active = true,
      task: ReturnType<typeof job<RenderResult>> | undefined;
    setBusy(true);
    const timer = setTimeout(() => {
      task = job<RenderResult>({
        pixels: photo.preview.data,
        width: photo.preview.width,
        height: photo.preview.height,
        source,
        reference,
        document,
      });
      task.promise
        .then((result) => {
          if (active) {
            setResult(result);
            setBusy(false);
          }
        })
        .catch((e) => {
          if (active) {
            setBusy(false);
            onError(e.message);
          }
        });
    }, 65);
    return () => {
      active = false;
      clearTimeout(timer);
      task?.cancel();
    };
  }, [photo, source, reference, document, onError]);
  return { result, busy };
}
