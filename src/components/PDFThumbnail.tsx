import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef } from "react";

type PdfThumbnailProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  thumbnailWidth: number;
  isSelected?: boolean;
};

export function PdfThumbnail({
  pdf,
  pageNumber,
  thumbnailWidth,
  isSelected = false,
}: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = thumbnailWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const outputScale = window.devicePixelRatio || 1;
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform: number[] | undefined =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined;

        renderTaskRef.current?.cancel();

        renderTaskRef.current = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform,
        });

        await renderTaskRef.current.promise;
        page.cleanup();
      } catch (error) {
        if ((error as Error).name !== "RenderingCancelledException") {
          console.error(`Failed to render page ${pageNumber}:`, error);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdf, pageNumber, thumbnailWidth]);

  return (
  <div
    className={`relative overflow-hidden rounded-xl border-2 transition-colors border-opacity-40 ${
      isSelected ? "border-red-500 bg-red-50" : "border-neutral-700 bg-white"
    }`}
  >
    <div className="flex justify-center bg-neutral-800 p-2 py-12 px-6">
      <canvas ref={canvasRef} className="block h-60 w-auto rounded-lg" />
    </div>

    {/* <div className="p-3">
      <p className="text-center text-sm font-medium text-neutral-900">
        Page {pageNumber}
      </p>
    </div> */}

    <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white">
      {pageNumber}
    </div>
  </div>
);
}
