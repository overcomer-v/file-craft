import { useState, useCallback } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { clearSession } from "../helpers/session.js";
import { useDBHandler } from "./useDBHandler.js";

/**
 * Shared core: given a source file, a 0-based array of *original* page
 * indexes in the desired *output* order, and an optional rotations map
 * (original page index -> degrees to add), builds a new PDF containing
 * exactly those pages, in that order, rotated as requested.
 *
 * - Deletion = pass an order that omits the indexes you want to drop.
 * - Rearrangement = pass every index, just in a different order.
 * - Rotation = set rotations[originalIndex] to 90/180/270.
 * - Any combination of the above = pass a reordered/filtered order plus
 *   whichever rotations apply to the pages that remain.
 */
async function buildFromOrder(
  file: File,
  order: number[],
  rotations: Record<number, number>,
  onProgress?: (current: number, total: number) => void,
) {
  const sourceBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const totalSourcePages = sourcePdf.getPageCount();

  const seen = new Set<number>();
  for (const pageIndex of order) {
    if (pageIndex < 0 || pageIndex >= totalSourcePages) {
      throw new Error(
        `Page ${pageIndex + 1} is out of range (document has ${totalSourcePages} pages).`,
      );
    }
    if (seen.has(pageIndex)) {
      throw new Error(`Page ${pageIndex + 1} was specified more than once.`);
    }
    seen.add(pageIndex);
  }

  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(sourcePdf, order);

  for (let i = 0; i < copiedPages.length; i++) {
    onProgress?.(i + 1, copiedPages.length);

    const page = copiedPages[i];
    if (!page) continue;

    const originalIndex = order[i];
    const rotationDelta =
      originalIndex !== undefined ? (rotations[originalIndex] ?? 0) : 0;

    if (rotationDelta !== 0) {
      // Additive: a page that was already rotated in the source PDF keeps
      // that rotation, with the user's requested delta added on top —
      // setRotation takes an absolute value, so read-then-add rather than
      // overwrite.
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + rotationDelta) % 360));
    }

    outputPdf.addPage(page);
  }

  return outputPdf.save({
    addDefaultPage: false,
    objectsPerTick: 20,
    useObjectStreams: true,
  });
}

export function usePdfPageManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const { clearDB } = useDBHandler();

  const runAndDownload = useCallback(
    async (
      sessionId: string,
      file: File | undefined,
      order: number[],
      rotations: Record<number, number>,
      fileName: string,
      suffix: string,
    ) => {
      setIsProcessing(true);
      setProgress(null);

      try {
        if (!file) {
          alert("No file provided.");
          return;
        }
        if (!order.length) {
          alert("No pages left — at least one page must remain.");
          return;
        }

        const outputBytes = await buildFromOrder(
          file,
          order,
          rotations,
          (current, total) => setProgress({ current, total }),
        );

        await clearDB(sessionId);
        clearSession();

        const blob = new Blob([outputBytes as Uint8Array<ArrayBuffer>], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);

        return {
          url,
          downloadName: fileName?.trim()
            ? `${fileName.trim()}-${suffix}.pdf`
            : `${Date.now()}-${suffix}.pdf`,
        };
      } catch (error) {
        console.error(`Failed to ${suffix} pdf:`, error);
        alert(
          error instanceof Error
            ? error.message
            : `Failed to ${suffix} PDF. Check console for details.`,
        );
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [clearDB],
  );

  /**
   * Delete pages by 0-based index. Everything not listed is kept, in its
   * original order.
   */
  const deletePages = useCallback(
    async (
      sessionId: string,
      file: File | undefined,
      pagesToDelete: number[],
      fileName = "",
    ) => {
      if (!file) return;

      const totalPages = (
        await PDFDocument.load(await file.arrayBuffer())
      ).getPageCount();

      const toDelete = new Set(pagesToDelete);
      const remainingOrder = Array.from({ length: totalPages }, (_, i) => i).filter(
        (i) => !toDelete.has(i),
      );

      return runAndDownload(sessionId, file, remainingOrder, {}, fileName, "edited");
    },
    [runAndDownload],
  );

  /**
   * Reorder pages by supplying the full desired order as 0-based original
   * indexes, e.g. dragging page 3 to the front: [2, 0, 1, 3, 4, ...].
   */
  const rearrangePages = useCallback(
    async (
      sessionId: string,
      file: File | undefined,
      newOrder: number[],
      fileName = "",
    ) => {
      return runAndDownload(sessionId, file, newOrder, {}, fileName, "reordered");
    },
    [runAndDownload],
  );

  /**
   * Do it all in one pass: final page order, optional per-original-index
   * rotation deltas (degrees, added to each page's existing rotation), and
   * an output filename. This is what the edit page's page grid should call
   * on save.
   */
  const applyPageOrder = useCallback(
    async (
      sessionId: string,
      file: File | undefined,
      finalOrder: number[],
      rotations: Record<number, number> = {},
      fileName = "",
    ) => {
      return runAndDownload(sessionId, file, finalOrder, rotations, fileName, "edited");
    },
    [runAndDownload],
  );

  return {
    deletePages,
    rearrangePages,
    applyPageOrder,
    isProcessing,
    progress,
  };
}