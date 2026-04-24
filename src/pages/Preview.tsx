import { useEffect, useState, useRef } from "react";
import { usePDFHandler } from "../hooks/usePDFHandler.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { db } from "../dexie.js";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface PreviewItem {
  id: string;
  url: string; // object URL — created here, revoked on cleanup
}

// --- Sortable Image Item ---
function SortableImage({
  id,
  url,
  index,
}: {
  id: string;
  url: string;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  return (
    <div
      className="relative overflow-hidden md:w-56 md:h-56 w-[45%] aspect-auto border-2 border-white-600 rounded-xl"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <img
        className="object-cover overflow-hidden pointer-events-none w-full h-full"
        src={url}
        alt=""
        draggable={false}
      />
      <div className="absolute bottom-3 right-3 bg-neutral-800 rounded-full px-3 font-semibold py-1 opacity-70">
        {index + 1}
      </div>
    </div>
  );
}

// --- Main Page ---
export function PreviewPage() {
  // allData holds every record from DB (with stable object URLs)
  const [allData, setAllData] = useState<(PreviewItem & { order: number })[]>(
    [],
  );
  // previewData is the current page slice, reordering applied on top
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);

  const { fetchFiles, isfileloading } = useDBHandler();
  const { createPDF, isConverting } = usePDFHandler();

  const [fitToImage, setFitToImage] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>("");
  const [pageNo, setPageNo] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();

  const LIMIT = 15;

  // Keep a ref to current object URLs so we can revoke them on unmount / refresh
  const objectURLsRef = useRef<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // mouse: require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // hold for 250ms before drag activates
        tolerance: 5, // allow 5px finger movement during the hold
      },
    }),
  );

  // Fetch all records once; slice client-side for pagination
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result: any = await fetchFiles();
        if (cancelled) return; // component unmounted while fetching, just bail

        if (!result || result.totalItems === 0) {
          navigate("/");
          return;
        }

        const { data, totalItems } = result;

        objectURLsRef.current.forEach((u) => URL.revokeObjectURL(u));
        objectURLsRef.current = [];

        const mapped = data.map((item: any) => {
          const url = URL.createObjectURL(item.file as Blob);
          objectURLsRef.current.push(url);
          return {
            id: String(item.id ?? item.order),
            url,
            order: item.order as number,
          };
        });

        setAllData(mapped);
        setTotal(totalItems ?? mapped.length);
      } catch (error) {
        console.error(error);
        alert(error);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetch once on mount — fetchFiles reference is unstable so exclude it

  // Revoke object URLs when the component unmounts
  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // Slice allData for the current page whenever allData or pageNo changes
  useEffect(() => {
    const start = (pageNo - 1) * LIMIT;
    const slice = allData
      .slice(start, start + LIMIT)
      .map(({ id, url }) => ({ id, url }));
    setPreviewData(slice);
  }, [allData, pageNo]);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allData.findIndex((item) => item.id === active.id);
    const newIndex = allData.findIndex((item) => item.id === over.id);

    // Compute once, use for both state and Dexie
    const reordered = arrayMove(allData, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        order: index,
      }),
    );

    // 1. Update UI state
    setAllData(reordered);

    // 2. Persist — use bulkUpdate to only touch the order field, not the whole record
    db.files.bulkUpdate(
      reordered.map((item) => ({
        key: Number(item.id),
        changes: { order: item.order },
      })),
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center w-full">
      <section className="w-full mb-6 flex justify-between items-center">
        <div>
          <h2 className="md:text-3xl text-xl font-medium">Images Preview</h2>
          <div className="w-12 h-[7px] rounded-2xl bg-red-600 mt-2"></div>
        </div>
        <button
          onClick={async () => {
            const { url, downloadName } =
              (await createPDF(fileName, fitToImage)) || {};
            navigate("/download-page", { state: { url, downloadName } });
          }}
          className="md:py-3 md:px-6 py-2 px-4 bg-red-600 rounded-full my-6 mt-auto font-medium flex items-center gap-2"
        >
          <span>Convert</span>
          {isConverting && <i className="fa fa-spinner animate-spin"></i>}
        </button>
      </section>

      <section className="self-start mb-10 flex flex-col md:flex-row md:justify-between text-white md:gap-16 gap-4 w-full">
        <div className="flex flex-col">
          <input
            placeholder="Filename"
            className="h-10 bg-neutral-800 rounded-lg w-60 px-4 placeholder:text-neutral-400 border-[2px] border-neutral-300"
            name="filename"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 md:justify-normal justify-between w-full md:w-fit">
          <p className="font-medium mr-4">Match page size to image size</p>
          <Switch checked={fitToImage} onChange={setFitToImage} />
        </div>
      </section>

      {/* Drag-and-drop grid */}
      <section className="flex flex-wrap gap-4 mb-12 items-center">
        {isfileloading ? (
          <div className="animate-spin fa fa-spinner text-5xl my-[15vh]" />
        ) : previewData.length === 0 ? (
          <p className="text-neutral-400 my-[15vh]">No images found.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={previewData.map((d) => d.id)}
              strategy={rectSortingStrategy}
            >
              {previewData.map((data, index) => (
                <SortableImage
                  key={data.id}
                  id={data.id}
                  url={data.url}
                  index={(pageNo - 1) * LIMIT + index}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>

      <Pagination
        total={total}
        limit={LIMIT}
        currentPage={pageNo}
        onPageChange={(page) => setPageNo(page)}
      />
    </main>
  );
}

// --- Pagination ---
function Pagination({
  total,
  limit = 15,
  currentPage,
  onPageChange,
}: {
  total: number;
  limit: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  function getPages(): (number | "...")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }

  const base =
    "min-w-[36px] h-9 px-4 rounded-md border border-gray-200 text-sm flex items-center justify-center transition-colors";
  const active = "bg-red-600 text-white border-gray-900 font-medium";
  const inactive =
    "bg-transparent text-gray-100 hover:bg-gray-100 hover:text-black";
  const disabledCls = "opacity-35 cursor-not-allowed";

  return (
    <div className="flex flex-col items-center gap-4 my-12">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${base} ${currentPage === 1 ? disabledCls : inactive}`}
        >
          ← Prev
        </button>
        {getPages().map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="text-gray-400 px-1 text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`${base} ${page === currentPage ? active : inactive}`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${base} ${currentPage === totalPages ? disabledCls : inactive}`}
        >
          Next →
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}

// --- Switch ---
function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-[3.5rem] items-center rounded-full transition ${
        checked ? "bg-red-600" : "bg-neutral-700"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-2"
        }`}
      />
    </button>
  );
}
