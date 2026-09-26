import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { useNavigate } from "react-router-dom";
import { getSessionId } from "../../helpers/session.js";
import * as pdfjsLib from "pdfjs-dist";
import { usePdfPageManager } from "../../hooks/usePDFEdithandler.js";
import { ReorderWorkspace } from "../ReorderWorkSpace.js";
import type { ReorderItem } from "../../types/reorder.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface EditPdfPreviewPageProps {
  file: File | undefined;
}

interface PdfPageItem extends ReorderItem {
  originalIndex: number;
}

export function EditPdfPreviewPage({ file }: EditPdfPreviewPageProps) {
  const navigate = useNavigate();

  const { applyPageOrder, isProcessing, progress } = usePdfPageManager();

  const [items, setItems] = useState<PdfPageItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<PdfPageItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const previewUrlsRef = useRef<string[]>([]);

  const sessionId = getSessionId();

  async function buildPdfPageItems(
    pdfBytes: ArrayBuffer,
  ): Promise<PdfPageItem[]> {
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();

    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdfDocument = await loadingTask.promise;

    const nextItems: PdfPageItem[] = [];

    for (let index = 0; index < pageCount; index++) {
      const page = await pdfDocument.getPage(index + 1);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create canvas context.");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.85);
      });

      if (!blob) {
        throw new Error(`Could not create preview for page ${index + 1}.`);
      }

      const previewUrl = URL.createObjectURL(blob);

      nextItems.push({
        id: `page-${index}`,
        dbKey: index,
        order: index,
        type: "pdf",
        file: blob,
        previewUrl,
        label: `Page ${index + 1}`,
        originalIndex: index,
      });
    }

    return nextItems;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      setIsLoading(true);

      try {
        const pdfBytes = await file?.arrayBuffer();

        if (!pdfBytes) {
          return;
        }

        const next = await buildPdfPageItems(pdfBytes);

        if (cancelled) {
          next.forEach((item) => URL.revokeObjectURL(item.previewUrl));
          return;
        }

        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = next.map((item) => item.previewUrl);

        setItems(next);
        setOrderedItems(next);
      } catch (error) {
        console.error("Failed to load PDF:", error);
        alert(error instanceof Error ? error.message : "Failed to load PDF.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPages();

    return () => {
      cancelled = true;

      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, [file]);

  async function handleConfirm(nextOrderedItems: PdfPageItem[]) {
    if (nextOrderedItems.length === 0) {
      alert("No pages left. At least one page must remain.");
      return;
    }

    const finalOrder = nextOrderedItems.map((item) => item.originalIndex);

    const result = await applyPageOrder(sessionId, file, finalOrder, fileName);

    if (!result) return;

    navigate("/download", {
      state: {
        url: result.url,
        downloadName: result.downloadName,
      },
    });
  }

  return (
    <main className="min-h-full bg-[#090909] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <i className="fa fa-edit text-red-500" />
              Edit PDF
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Arrange PDF Pages
            </h1>

            <div className="mt-3 h-1 w-10 rounded-full bg-red-500" />

            <p className="mt-3 text-sm text-neutral-500">
              Drag pages to reorder them before saving your PDF.
            </p>
          </div>

          <button
            onClick={() => handleConfirm(orderedItems)}
            disabled={isProcessing || isLoading || orderedItems.length === 0}
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg
              bg-red-600
              px-5 py-3
              text-sm font-semibold
              transition
              hover:bg-red-500
              disabled:cursor-not-allowed
              disabled:bg-neutral-800
              disabled:text-neutral-600
            "
          >
            {isProcessing ? (
              <>
                <i className="fa fa-spinner fa-spin" />
                Processing...
              </>
            ) : (
              <>
                <i className="fa fa-file-pdf" />
                Save PDF
              </>
            )}
          </button>
        </section>

        {/* Options */}
        <section className="mb-8 rounded-xl border border-neutral-800 bg-[#111111] p-4 md:p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <label
                htmlFor="filename"
                className="text-xs font-medium uppercase tracking-wider text-neutral-500"
              >
                Output filename
              </label>

              <input
                id="filename"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Filename"
                className="
                  mt-2 h-11 w-full rounded-lg
                  border border-neutral-800
                  bg-[#0b0b0b]
                  px-4
                  text-sm text-white
                  outline-none
                  placeholder:text-neutral-600
                  focus:border-red-600
                  md:w-72
                "
              />
            </div>

            <div className="flex items-center justify-between gap-6 border-t border-neutral-800 pt-4 md:border-t-0 md:pt-0">
              <div>
                <p className="text-sm font-medium text-neutral-200">Pages</p>

                <p className="mt-1 text-xs text-neutral-500">
                  {orderedItems.length}{" "}
                  {orderedItems.length === 1 ? "page" : "pages"} remaining
                </p>
              </div>

              <div className="rounded-full border border-neutral-800 bg-[#0b0b0b] px-3 py-1.5 text-xs text-neutral-500">
                {file?.name}
              </div>
            </div>
          </div>
        </section>

        {/* Processing */}
        {isProcessing && progress && (
          <div className="mb-6 rounded-xl border border-neutral-800 bg-[#111111] p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Building PDF...</span>
              <span className="text-neutral-500">
                {progress.current} / {progress.total}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{
                  width: `${
                    progress.total > 0
                      ? (progress.current / progress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Page workspace */}
        <section className="rounded-xl border border-neutral-800 bg-[#111111] p-3 md:p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold text-neutral-200">
                Page order
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {isLoading
                  ? "Loading PDF pages..."
                  : "Drag and drop pages to rearrange them"}
              </p>
            </div>

            {!isLoading && orderedItems.length > 0 && (
              <span className="rounded-full border border-neutral-800 bg-[#0b0b0b] px-3 py-1 text-xs text-neutral-500">
                {orderedItems.length} total
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <i className="fa fa-spinner fa-spin text-2xl text-red-500" />
                <p className="text-sm text-neutral-500">Loading PDF pages...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-800 bg-[#0b0b0b] p-2 md:p-3">
              <ReorderWorkspace
                items={items}
                onOrderChange={setItems}
                orderedItems={orderedItems}
                setOrderedItems={setOrderedItems}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}