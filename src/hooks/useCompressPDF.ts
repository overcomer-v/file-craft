import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { clearSession } from "../helpers/session.js";
import { useDBHandler } from "./useDBHandler.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type CompressionLevel = "low" | "medium" | "high";

// scale = render resolution multiplier (higher = sharper, bigger file)
// quality = JPEG quality 0-1 (higher = better, bigger file)
const LEVEL_SETTINGS: Record<
  CompressionLevel,
  { scale: number; quality: number }
> = {
  low: { scale: 2, quality: 0.85 },
  medium: { scale: 1.5, quality: 0.7 },
  high: { scale: 1, quality: 0.5 },
};

function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode page as JPEG."));
          return;
        }
        blob.arrayBuffer().then(resolve).catch(reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

export function usePdfCompress() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const { clearDB } = useDBHandler();

  const compressPdf = useCallback(
    async (
      sessionId: string,
      file: File | undefined,
      level: CompressionLevel,
      fileName = "",
    ) => {
      setIsCompressing(true);
      setProgress(null);

      try {
        if (!file) {
          alert("No file provided.");
          return;
        }

        const { scale, quality } = LEVEL_SETTINGS[level];
        const originalBytes = await file.arrayBuffer();
        const originalSize = originalBytes.byteLength;

        // .slice(0) — pdfjs may transfer/detach the buffer it's given to its
        // worker; keep an untouched copy since we may need originalBytes
        // again below for the structural-only fallback.
        const loadingTask = pdfjsLib.getDocument({
          data: originalBytes.slice(0),
        });
        const pdfDocument = await loadingTask.promise;
        const pageCount = pdfDocument.numPages;

        const rasterizedPdf = await PDFDocument.create();

        for (let index = 0; index < pageCount; index++) {
          setProgress({ current: index + 1, total: pageCount });

          const page = await pdfDocument.getPage(index + 1);

          // Render at the compression-level scale for the actual pixels...
          const renderViewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = renderViewport.width;
          canvas.height = renderViewport.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not create canvas context.");
          await page.render({
            canvas,
            canvasContext: context,
            viewport: renderViewport,
          }).promise;

          const jpegBytes = await canvasToJpegBytes(canvas, quality);
          const embeddedImage = await rasterizedPdf.embedJpg(jpegBytes);

          // ...but size the output page at the PDF's real point dimensions
          // (scale: 1) so the document still measures/prints correctly.
          const pageViewport = page.getViewport({ scale: 1 });
          const outPage = rasterizedPdf.addPage([
            pageViewport.width,
            pageViewport.height,
          ]);
          outPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pageViewport.width,
            height: pageViewport.height,
          });
        }

        const rasterizedBytes = await rasterizedPdf.save({
          useObjectStreams: true,
        });

        let finalBytes: Uint8Array = rasterizedBytes;

        if (rasterizedBytes.byteLength >= originalSize) {
          // Rasterizing didn't help (common for text/vector-heavy PDFs) —
          // fall back to a lossless structural resave instead.
          const structuralDoc = await PDFDocument.load(originalBytes);
          const structuralBytes = await structuralDoc.save({
            useObjectStreams: true,
          });

          if (structuralBytes.byteLength >= originalSize) {
            alert(
              "This PDF is already well-optimized — compression wouldn't reduce its size.",
            );
            return;
          }

          finalBytes = structuralBytes;
        }

        await clearDB(sessionId);
        clearSession();

        const blob = new Blob([finalBytes as Uint8Array<ArrayBuffer>], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);

        return {
          url,
          downloadName: fileName?.trim()
            ? `${fileName.trim()}-compressed.pdf`
            : `${Date.now()}-compressed.pdf`,
          originalSize,
          compressedSize: finalBytes.byteLength,
        };
      } catch (error) {
        console.error("PDF compression failed:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to compress PDF. Check console for details.",
        );
      } finally {
        setIsCompressing(false);
        setProgress(null);
      }
    },
    [clearDB],
  );

  return { compressPdf, isCompressing, progress };
}