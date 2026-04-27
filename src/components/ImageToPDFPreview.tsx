import { useEffect, useRef, useState } from "react";
import type { ReorderItem } from "../types/reorder.js";
import { ReorderWorkspace } from "./ReorderWorkSpace.js";
import { Switch } from "./Switch.js";
import { usePDFHandler } from "../hooks/usePDFHandler.js";
import { useNavigate } from "react-router-dom";
import { getSessionId } from "../helpers/session.js";
import { db } from "../dexie.js";
import type { UploadedFile } from "../types/itemTypes.js";

interface ImageToPdfArrangePageProps {
  files: UploadedFile[];
}

export function ImageToPdfPreviewPage({ files }: ImageToPdfArrangePageProps) {
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

        <div className="flex w-full items-center justify-between gap-2 md:w-fit md:justify-normal">
          <p className="mr-4 font-medium">Match page size to image size</p>
          <Switch checked={fitToImage} onChange={setFitToImage} />
        </div>
      </section>

      <ReorderWorkspace
        items={items}
        onOrderChange={setItems}
        orderedItems={orderedItems}
        setOrderedItems={setOrderedItems}
      />
    </div>
  );
}
