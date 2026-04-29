// pages/PdfMergeArrangePage.tsx
import { useEffect, useRef, useState } from "react";
import type { ReorderItem } from "../types/reorder.js";
import { ReorderWorkspace } from "./ReorderWorkSpace.js";
import { usePDFHandler } from "../hooks/usePDFHandler.js";
import { db } from "../dexie.js";
import { getSessionId } from "../helpers/session.js";
import { useNavigate } from "react-router-dom";
import type { UploadedFile } from "../types/itemTypes.js";

interface PdfMergeArrangePageProps {
  files: UploadedFile[];
}

export function PdfMergePreviewPage({ files }: PdfMergeArrangePageProps) {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);
  const [orderedItems, setOrderedItems] = useState<ReorderItem[]>(items);
  const [fileName, setFileName] = useState<string>("");
  const { mergePDFs } = usePDFHandler();
  const navigate = useNavigate();

 async function buildPdfItems(files: any[]): Promise<ReorderItem[]> {
  return Promise.all(
    files.map(async (file, index) => {
      const previewUrl = URL.createObjectURL(file.file);

      return {
        id: `${file.name}-${index}`,
        dbKey:file.id,
        order: index,
        type: "pdf",
        file:file.file,
        previewUrl,
        label: file.name,
        meta: {
          pageCount:1
        },
      };
    }),
  );
}

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await buildPdfItems(files);
      if (cancelled) return;

      console.log("from builder",next);

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = next.map((item) => item.previewUrl);
      setItems(next);
    }

    load();

    return () => {
      cancelled = true;
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleConfirm(nextOrderedItems: ReorderItem[]) {
    setIsBusy(true);

    try {
      await db.files.bulkUpdate(
        nextOrderedItems.map((item, index) => ({
          key: item.dbKey,
          changes: { order: index },
        })),
      );

      console.log("nextordered",nextOrderedItems);

      const name = fileName || `${Date.now()}-Output-filecraft`;

      const { url, downloadName } =
        (await mergePDFs(
          nextOrderedItems.map((file) => file.file),
          name,getSessionId()
        )) || {};

      navigate("/download", { state: { url, downloadName } });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div>
      <section className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium md:text-3xl">ArrangeImages</h2>
          <div className="mt-2 h-1.5 w-12 rounded-2xl bg-red-600" />
        </div>

        <button
          onClick={() => handleConfirm(orderedItems)}
          disabled={isBusy || orderedItems.length === 0}
          className="rounded-full bg-red-600 px-5 py-3 font-medium disabled:opacity-50"
        >
          Convert
        </button>
      </section>

      <section className="self-start mb-10 flex w-full flex-col gap-4 text-white md:flex-row md:justify-between md:gap-16">
        <div className="flex flex-col">
          <input
            placeholder="Filename"
            className="h-10 w-60 rounded-lg border-[2px] border-neutral-300 bg-neutral-800 px-4 placeholder:text-neutral-400"
            name="filename"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>
      </section>
      <ReorderWorkspace
        items={items}
        onOrderChange={setItems}
        setOrderedItems={setOrderedItems}
        orderedItems={orderedItems}
      />
    </div>
  );
}
