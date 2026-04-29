import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import { Paginator } from "./Pagenator.js";
import { PdfThumbnail } from "./PDFThumbnail.js";
import { RangeItem } from "./RangeItem.js";
import { usePdfSplit } from "../hooks/usePDFSplitHandler.js";
import { getSessionId } from "../helpers/session.js";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfPreviewPagerProps = {
  file: File | undefined;
  pagesPerView?: number;
  thumbnailWidth?: number;
  onRangesChange?: (ranges: NormalizedRange[]) => void;
};

export type NormalizedRange = {
  start: number;
  end: number;
};

export type RangeInput = {
  id: string;
  start: string;
  end: string;
};

type PdfSplitRangesProps = {
  ranges: RangeInput[];
  errors: Record<string, string>;
  validRangeCount: number;
  selectedPagesCount: number;
  totalPages: number;
  onAddRange: () => void;
  onRemoveRange: (id: string) => void;
  onUpdateRange: (id: string, key: "start" | "end", value: string) => void;
};

function createRange(): RangeInput {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    start: "",
    end: "",
  };
}

export function PdfSplitPreview({
  file,
  pagesPerView = 6,
  thumbnailWidth = 200,
  onRangesChange,
}: PdfPreviewPagerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [ranges, setRanges] = useState<RangeInput[]>([createRange()]);

  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const { splitPdf, isFileSplitting } = usePdfSplit();

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        if (!file) {
          setPdf(null);
          setTotalPages(0);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setCurrentPage(1);

        loadingTaskRef.current?.destroy();
        if (pdfRef.current) {
          await pdfRef.current.destroy();
          pdfRef.current = null;
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const loadingTask = getDocument({ data: bytes });
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;

        if (cancelled) {
          await doc.destroy();
          return;
        }

        pdfRef.current = doc;
        setPdf(doc);
        setTotalPages(doc.numPages);
      } catch (error) {
        console.error("Failed to load PDF preview:", error);
        setPdf(null);
        setTotalPages(0);
        setErrorMessage("Could not load PDF preview.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy();
      void pdfRef.current?.destroy();
      pdfRef.current = null;
    };
  }, [file]);

  const totalGroups = Math.max(1, Math.ceil(totalPages / pagesPerView));

  useEffect(() => {
    if (currentPage > totalGroups) {
      setCurrentPage(totalGroups);
    }
  }, [currentPage, totalGroups]);

  const visiblePages = useMemo(() => {
    const start = (currentPage - 1) * pagesPerView + 1;
    const end = Math.min(start + pagesPerView - 1, totalPages);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
  }, [currentPage, pagesPerView, totalPages]);

  const parsedRanges = useMemo(() => {
    const errors: Record<string, string> = {};
    const normalizedRanges: NormalizedRange[] = [];
    const selectedPageSet = new Set<number>();

    for (const range of ranges) {
      const startValue = range.start.trim();
      const endValue = range.end.trim();

      if (!startValue && !endValue) continue;

      if (!startValue || !endValue) {
        errors[range.id] = "Enter both start and end pages.";
        continue;
      }

      const start = Number(startValue);
      const end = Number(endValue);

      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        errors[range.id] = "Page values must be whole numbers.";
        continue;
      }

      if (start < 1 || end < 1) {
        errors[range.id] = "Pages must start from 1.";
        continue;
      }

      if (totalPages > 0 && (start > totalPages || end > totalPages)) {
        errors[range.id] = `Pages must be between 1 and ${totalPages}.`;
        continue;
      }

      if (start > end) {
        errors[range.id] = "Start page cannot be greater than end page.";
        continue;
      }

      normalizedRanges.push({ start, end });

      for (let page = start; page <= end; page += 1) {
        selectedPageSet.add(page);
      }
    }

    return {
      errors,
      normalizedRanges,
      selectedPages: [...selectedPageSet].sort((a, b) => a - b),
    };
  }, [ranges, totalPages]);

  useEffect(() => {
    onRangesChange?.(parsedRanges.normalizedRanges);
  }, [onRangesChange, parsedRanges.normalizedRanges]);

  const selectedPageSet = useMemo(
    () => new Set(parsedRanges.selectedPages),
    [parsedRanges.selectedPages],
  );

  function updateRange(id: string, key: "start" | "end", value: string) {
    setRanges((prev) =>
      prev.map((range) =>
        range.id === id ? { ...range, [key]: value } : range,
      ),
    );
  }

  function addRange() {
    setRanges((prev) => [...prev, createRange()]);
  }

  function removeRange(id: string) {
    setRanges((prev) => {
      if (prev.length === 1) {
        return [
          {
            id: prev[0]!.id,
            start: "",
            end: "",
          },
        ];
      }

      return prev.filter((range) => range.id !== id);
    });
  }

  function handleSplit() {
    void splitPdf(getSessionId() ,file, parsedRanges.normalizedRanges);
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading preview...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  if (!pdf) {
    return null;
  }

  return (
    <div className="flex flex-col-reverse gap-6 md:flex-row">
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">PDF preview</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Select ranges, then split and download each file immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSplit}
            disabled={
              !file ||
              isFileSplitting ||
              parsedRanges.normalizedRanges.length === 0
            }
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFileSplitting ? "Splitting..." : "Split PDF"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {visiblePages.map((pageNumber) => (
            <PdfThumbnail
              key={pageNumber}
              pdf={pdf}
              pageNumber={pageNumber}
              thumbnailWidth={thumbnailWidth}
              isSelected={selectedPageSet.has(pageNumber)}
            />
          ))}
        </div>

        <Paginator
          total={totalPages}
          limit={pagesPerView}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <PdfSplitRanges
        ranges={ranges}
        errors={parsedRanges.errors}
        validRangeCount={parsedRanges.normalizedRanges.length}
        selectedPagesCount={parsedRanges.selectedPages.length}
        totalPages={totalPages}
        onAddRange={addRange}
        onRemoveRange={removeRange}
        onUpdateRange={updateRange}
      />
    </div>
  );
}

export function PdfSplitRanges({
  ranges,
  errors,
  validRangeCount,
  selectedPagesCount,
  totalPages,
  onAddRange,
  onRemoveRange,
  onUpdateRange,
}: PdfSplitRangesProps) {
  return (
    <aside className="w-full rounded-xl bg-neutral-800 px-6 py-8 md:w-[340px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Split ranges</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Use page numbers like 1-3, 4-6, 8-8
          </p>
        </div>

        <button
          type="button"
          onClick={onAddRange}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white text-nowrap"
        >
          Add range
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {ranges.map((range, index) => (
          <RangeItem
            key={range.id}
            index={index}
            range={range}
            totalPages={totalPages}
            errors={errors}
            onRemoveRange={onRemoveRange}
            onUpdateRange={onUpdateRange}
          />
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm font-semibold text-neutral-600">
        <p>Valid ranges: {validRangeCount}</p>
        <p>Selected pages: {selectedPagesCount}</p>
        <p>Total pages: {totalPages}</p>
      </div>
    </aside>
  );
}
