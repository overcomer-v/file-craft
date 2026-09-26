import { useEffect, useRef, useState } from "react";

import type { ReorderItem } from "../../types/reorder.js";
import { ReorderWorkspace } from "../ReorderWorkSpace.js";
import { Switch } from "../Switch.js";
import { usePDFHandler } from "../../hooks/usePDFHandler.js";
import { useNavigate } from "react-router-dom";
import { getSessionId } from "../../helpers/session.js";
import { db } from "../../dexie.js";
import type { UploadedFile } from "../../types/itemTypes.js";

interface ImageToPdfArrangePageProps {
  files: UploadedFile[];
}

export function ImageToPdfPreviewPage({
  files,
}: ImageToPdfArrangePageProps) {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<ReorderItem[]>([]);
  const [fitToImage, setFitToImage] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);

  const { createPDF } = usePDFHandler();
  const navigate = useNavigate();

  const objectUrlsRef = useRef<string[]>([]);
  const sessionId = getSessionId();

  function buildImageItems(files: any[]): ReorderItem[] {
    return files.map((file, index) => ({
      id: `${file.name}-${index}`,
      dbKey: file.id,
      order: index,
      type: "image",
      file,
      previewUrl: URL.createObjectURL(file.file),
      label: file.name,
    }));
  }

  useEffect(() => {
    let isActive = true;

    const loadItems = async () => {
      const storedFiles = await db.files
        .where("sessionId")
        .equals(sessionId)
        .sortBy("order");

      const next = buildImageItems(storedFiles);

      if (!isActive) {
        next.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return;
      }

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = next.map((item) => item.previewUrl);

      setItems(next);
      setOrderedItems(next);
    };

    void loadItems();

    return () => {
      isActive = false;

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, [files, sessionId]);

  async function handleConfirm(nextOrderedItems: ReorderItem[]) {
    setIsBusy(true);

    try {
      await db.files.bulkUpdate(
        nextOrderedItems.map((item, index) => ({
          key: item.dbKey,
          changes: { order: index },
        })),
      );

      const name = fileName || `${Date.now()}-Output-filecraft`;

      const { url, downloadName } =
        (await createPDF(sessionId, name, fitToImage)) || {};

      navigate("/download", {
        state: { url, downloadName },
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-[#090909] text-white">
      {/* Header */}
      <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
            <i className="fa fa-image text-red-500" />
            Image to PDF
          </div>

          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Arrange Images
          </h2>

          <div className="mt-3 h-1 w-10 rounded-full bg-red-500" />
        </div>

        <button
          onClick={() => handleConfirm(orderedItems)}
          disabled={isBusy || orderedItems.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
        >
          {isBusy ? (
            <>
              <i className="fa fa-spinner fa-spin" />
              Converting...
            </>
          ) : (
            <>
              <i className="fa fa-file-pdf" />
              Convert to PDF
            </>
          )}
        </button>
      </section>

      {/* Options */}
      <section className="mb-8 rounded-xl border border-neutral-800 bg-[#111111] p-4 md:p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* Filename */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="filename"
              className="text-xs font-medium uppercase tracking-wider text-neutral-500"
            >
              Output filename
            </label>

            <input
              id="filename"
              placeholder="Filename"
              name="filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-11 w-full rounded-lg border border-neutral-800 bg-[#0b0b0b] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-red-600 md:w-72"
            />
          </div>

          {/* Fit to image */}
          <div className="flex items-center justify-between gap-5 border-t border-neutral-800 pt-4 md:border-t-0 md:pt-0">
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Match page size to image
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Use each image's dimensions for its PDF page
              </p>
            </div>

            <Switch checked={fitToImage} onChange={setFitToImage} />
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="rounded-xl border border-neutral-800 bg-[#111111] p-3 md:p-5">
        <div className="mb-4 flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-neutral-200">
              Page order
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Drag and drop images to rearrange them
            </p>
          </div>

          <span className="rounded-full border border-neutral-800 bg-[#0b0b0b] px-3 py-1 text-xs text-neutral-500">
            {orderedItems.length}{" "}
            {orderedItems.length === 1 ? "image" : "images"}
          </span>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-[#0b0b0b] p-2 md:p-3">
          <ReorderWorkspace
            items={items}
            onOrderChange={setItems}
            orderedItems={orderedItems}
            setOrderedItems={setOrderedItems}
          />
        </div>
      </section>
    </div>
  );
}