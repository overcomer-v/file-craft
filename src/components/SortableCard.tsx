// components/SortablePreviewCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReorderItem } from "../types/reorder.js";

interface SortablePreviewCardProps {
  item: ReorderItem;
  index: number;
}

export function SortablePreviewCard({ item, index }: SortablePreviewCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BasePreviewCards
        label={item.label}
        index={index}
        pageCount={item.meta?.pageCount}
        previewUrl={item.previewUrl}
        type={item.type}
      />
    </div>
  );
}

export function BasePreviewCards({
  label,
  type,
  pageCount,
  index,
  previewUrl,
}: {
  label: string;
  type: "image" | "pdf";
  pageCount?: number | undefined;
  previewUrl?: string;
  index?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 w-[45%] md:w-56">
      <div className="aspect-[3/4] overflow-hidden bg-neutral-800">
        {type === "image" && previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            draggable={false}
            className="h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            <i className="fa-solid fa-file-pdf text-6xl text-red-500" />
            <p className="px-3 text-center text-sm font-medium text-white">
              PDF File
            </p>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium">{label}</p>
        {type === "pdf" && pageCount && (
          <p className="text-xs text-neutral-400">{pageCount} pages</p>
        )}
      </div>

  { index && <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold">
    {index + 1}
  </div>}
    </div>
  );
}
