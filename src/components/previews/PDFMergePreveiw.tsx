// pages/PdfMergeArrangePage.tsx

import { useEffect, useRef, useState } from "react";

import type { ReorderItem } from "../../types/reorder.js";
import { ReorderWorkspace } from "../ReorderWorkSpace.js";
import { usePDFHandler } from "../../hooks/usePDFHandler.js";
import { db } from "../../dexie.js";
import { getSessionId } from "../../helpers/session.js";
import { useNavigate } from "react-router-dom";
import type { UploadedFile } from "../../types/itemTypes.js";

interface PdfMergeArrangePageProps {
  files: UploadedFile[];
}

export function PdfMergePreviewPage({
  files,
}: PdfMergeArrangePageProps) {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [orderedItems, setOrderedItems] =
    useState<ReorderItem[]>(items);
  const [fileName, setFileName] = useState("");

  const objectUrlsRef = useRef<string[]>([]);

  const { mergePDFs } = usePDFHandler();
  const navigate = useNavigate();

  async function buildPdfItems(
    files: any[]
  ): Promise<ReorderItem[]> {
    return Promise.all(
      files.map(async (file, index) => {
        const previewUrl = URL.createObjectURL(file.file);

        return {
          id: `${file.name}-${index}`,
          dbKey: file.id,
          order: index,
          type: "pdf",
          file: file.file,
          previewUrl,
          label: file.name,
          meta: {
            pageCount: 1,
          },
        };
      })
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await buildPdfItems(files);

      if (cancelled) return;

      objectUrlsRef.current.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      objectUrlsRef.current = next.map(
        (item) => item.previewUrl
      );

      setItems(next);
      setOrderedItems(next);
    }

    load();

    return () => {
      cancelled = true;

      objectUrlsRef.current.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [files]);

  async function handleConfirm(
    nextOrderedItems: ReorderItem[]
  ) {
    setIsBusy(true);

    try {
      await db.files.bulkUpdate(
        nextOrderedItems.map((item, index) => ({
          key: item.dbKey,
          changes: {
            order: index,
          },
        }))
      );

      const name =
        fileName.trim() ||
        `${Date.now()}-Output-filecraft`;

      const { url, downloadName } =
        (await mergePDFs(
          nextOrderedItems.map((file) => file.file),
          name,
          getSessionId()
        )) || {};

      navigate("/download", {
        state: {
          url,
          downloadName,
        },
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-full w-full bg-[#090909] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-10">

        {/* Header */}
        <section className="flex flex-col gap-6 border-b border-neutral-800 pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <i className="fa fa-layer-group text-red-500" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Arrange PDFs
                </h1>

                <p className="mt-1 text-sm text-neutral-500">
                  Reorder your files before merging them.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleConfirm(orderedItems)}
            disabled={isBusy || orderedItems.length === 0}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl
              bg-red-500
              px-6 py-3
              text-sm font-semibold
              text-white
              transition-all duration-200
              hover:bg-red-400
              hover:shadow-[0_0_25px_rgba(239,68,68,0.15)]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:bg-neutral-800
              disabled:text-neutral-500
            "
          >
            {isBusy ? (
              <>
                <i className="fa fa-spinner fa-spin text-xs" />
                Merging...
              </>
            ) : (
              <>
                <i className="fa fa-object-group text-xs" />
                Merge PDFs
              </>
            )}
          </button>
        </section>

        {/* Settings */}
        <section className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <label
              htmlFor="filename"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Output filename
            </label>

            <div className="relative">
              <i
                className="
                  fa fa-file-pdf
                  absolute left-3.5 top-1/2
                  -translate-y-1/2
                  text-sm text-neutral-600
                "
              />

              <input
                id="filename"
                name="filename"
                type="text"
                placeholder="Output filename"
                value={fileName}
                onChange={(e) =>
                  setFileName(e.target.value)
                }
                className="
                  h-11 w-full
                  rounded-xl
                  border border-neutral-800
                  bg-[#111111]
                  pl-10 pr-4
                  text-sm text-white
                  outline-none
                  transition-colors

                  placeholder:text-neutral-600

                  focus:border-red-500/50
                  focus:ring-1
                  focus:ring-red-500/20

                  md:w-80
                "
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <i className="fa fa-file-pdf text-xs text-red-500" />

            <span>
              {orderedItems.length}{" "}
              {orderedItems.length === 1
                ? "PDF"
                : "PDFs"}{" "}
              selected
            </span>
          </div>
        </section>

        {/* Workspace */}
        <section className="mt-8">
          <div
            className="
              overflow-hidden
              rounded-2xl
              border border-neutral-800
              bg-[#111111]
            "
          >
            {/* Workspace toolbar */}
            <div
              className="
                flex items-center justify-between
                border-b border-neutral-800
                px-5 py-4
              "
            >
              <div>
                <p className="text-sm font-medium text-neutral-300">
                  Document order
                </p>

                <p className="mt-0.5 text-xs text-neutral-600">
                  Drag and drop to rearrange
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs text-neutral-600 sm:flex">
                <i className="fa fa-arrows-up-down" />
                Drag to reorder
              </div>
            </div>

            {/* Reorder area */}
            <div className="min-h-[400px] bg-[#0d0d0d] p-5 md:p-8">
              <ReorderWorkspace
                items={items}
                onOrderChange={setItems}
                setOrderedItems={setOrderedItems}
                orderedItems={orderedItems}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}