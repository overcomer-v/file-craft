import * as pdfjsLib from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";

// Centralized here so the pdfjs worker only needs configuring once, instead
// of once per file that renders a page. Importing this module (for either
// export below) runs this as a side effect the first time, and every
// subsequent import reuses the same module instance — callers that still
// need `pdfjsLib` directly (e.g. for `getDocument`) no longer need to set
// `workerSrc` themselves.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Renders one pdfjs page onto a freshly created canvas at the given scale.
 *
 * This is the one place the required `canvas` property on RenderParameters
 * needs to be right (see: the render-call bug chased through two separate
 * copies of this logic earlier) — fix it here once, every caller inherits
 * the fix.
 */
export async function renderPdfPageToCanvas(
  page: PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return canvas;
}

/**
 * Promise wrapper around the callback-based canvas.toBlob, since every
 * caller was re-writing this same wrapper by hand.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode canvas to a blob."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}