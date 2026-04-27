import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export type PdfSplitRange = {
  start: number;
  end: number;
};

function createFileName(fileName: string, range: PdfSplitRange, index: number) {
  const baseName = fileName.replace(/\.pdf$/i, "");
  return `${baseName}-part-${index + 1}-${range.start}-${range.end}.pdf`;
}

function downloadFile(bytes: Uint8Array, fileName: string) {
  const safeBytes = new Uint8Array(bytes);
  const fileUrl = URL.createObjectURL(
    new Blob([safeBytes.buffer], { type: "application/pdf" }),
  );
  const link = document.createElement("a");

  link.href = fileUrl;
  link.download = fileName;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(fileUrl);
  }, 0);
}

function validateRange(range: PdfSplitRange, totalPages: number, index: number) {
  if (range.start < 1 || range.end < 1) {
    throw new Error(`Range ${index + 1} must start from page 1 or later.`);
  }

  if (range.start > range.end) {
    throw new Error(`Range ${index + 1} has an invalid page order.`);
  }

  if (range.end > totalPages) {
    throw new Error(
      `Range ${index + 1} exceeds the document length of ${totalPages} pages.`,
    );
  }
}

function waitForNextTick() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export function usePdfSplit() {
  const [isFileSplitting, setIsFileSplitting] = useState(false);

  const splitPdf = async (file: File | undefined, ranges: PdfSplitRange[]) => {
    try {
      setIsFileSplitting(true);
      if (!file || !ranges.length) return;

      const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
      const totalPages = sourcePdf.getPageCount();

      for (const [index, range] of ranges.entries()) {
        validateRange(range, totalPages, index);

        const outputPdf = await PDFDocument.create();
        const pageIndexes: number[] = [];

        for (let page = range.start - 1; page < range.end; page += 1) {
          pageIndexes.push(page);
        }

        const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndexes);

        for (const page of copiedPages) {
          outputPdf.addPage(page);
        }

        const outputBytes = await outputPdf.save({
          addDefaultPage: false,
          objectsPerTick: 20,
          useObjectStreams: true,
        });

        downloadFile(outputBytes, createFileName(file.name, range, index));
        await waitForNextTick();
      }
    } catch (error) {
      console.error("Failed to split pdf:", error);
    } finally {
      setIsFileSplitting(false);
    }
  };

  return { splitPdf, isFileSplitting };
}
