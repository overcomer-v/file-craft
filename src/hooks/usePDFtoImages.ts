import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { clearSession } from "../helpers/session.js";
import { useDBHandler } from "./useDBHandler.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type ImageFormat = "png" | "jpeg";

export interface PdfToImagesOptions {
  format: ImageFormat;
  scale: number; // render resolution multiplier — higher = sharper, bigger files
  quality: number; // 0-1, only applies when format is "jpeg"
  pages?: number[]; // 0-based page indexes to export; omit/empty = every page
}

function pageToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode page as image."));
          return;
        }
        resolve(blob);
      },
      format === "png" ? "image/png" : "image/jpeg",
      format === "jpeg" ? quality : undefined,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function waitForNextTick() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export function usePdfToImages() {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const { clearDB } = useDBHandler();

  const convertToImages = async (
    sessionId: string,
    file: File | undefined,
    options: PdfToImagesOptions,
  ) => {
    setIsConverting(true);
    setProgress(null);

    try {
      if (!file) {
        alert("No file provided.");
        return;
      }

      const { format, scale, quality, pages } = options;
      const baseName = file.name.replace(/\.pdf$/i, "");
      const extension = format === "png" ? "png" : "jpg";

      const sourceBytes = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: sourceBytes });
      const pdfDocument = await loadingTask.promise;
      const pageCount = pdfDocument.numPages;

      const pageIndexes =
        pages && pages.length > 0
          ? pages
          : Array.from({ length: pageCount }, (_, i) => i);

      const total = pageIndexes.length;

      if (total === 0) {
        alert("No pages selected to convert.");
        return;
      }

      for (let i = 0; i < total; i++) {
        setProgress({ current: i + 1, total });

        const pageIndex = pageIndexes[i];
        if (
          pageIndex === undefined ||
          pageIndex < 0 ||
          pageIndex >= pageCount
        ) {
          continue;
        }

        const page = await pdfDocument.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create canvas context.");

        await page.render({ canvas, canvasContext: context, viewport })
          .promise;

        const blob = await pageToBlob(canvas, format, quality);

        downloadBlob(blob, `${baseName}-page-${pageIndex + 1}.${extension}`);

        await waitForNextTick();
      }

      await clearDB(sessionId);
      clearSession();
    } catch (error) {
      console.error("PDF to images conversion failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to convert PDF to images. Check console for details.",
      );
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  return { convertToImages, isConverting, progress };
}