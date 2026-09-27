import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReorderItem } from "../types/reorder.js";

interface SortablePreviewCardProps {
  item: ReorderItem;
  index: number;
  rotation?: number;
  onRotate?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  actionsDisabled?: boolean;
}

export function SortablePreviewCard({
  item,
  index,
  rotation,
  onRotate,
  onDelete,
  deleteDisabled,
  actionsDisabled,
}: SortablePreviewCardProps) {
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
        rotation={rotation ?? 0}
        onRotate={onRotate}
        onDelete={onDelete}
        deleteDisabled={deleteDisabled}
        actionsDisabled={actionsDisabled}
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
  rotation = 0,
  onRotate,
  onDelete,
  deleteDisabled,
  actionsDisabled,
}: {
  label: string;
  type: "image" | "pdf";
  pageCount?: number | undefined;
  previewUrl?: string;
  index?: number;
  rotation?: number;
  onRotate?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  actionsDisabled?: boolean;
}) {
  // The whole card is a drag handle (SortablePreviewCard spreads
  // {...listeners} on the outer div, no separate handle element), so any
  // interactive control placed inside it needs to stop its pointer event
  // before dnd-kit's sensors see it — otherwise a tap can be read as the
  // start of a drag instead of a click.
  function stopForDrag(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 w-[45%] md:w-56">
      <div className="aspect-[3/4] overflow-hidden bg-neutral-800">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            draggable={false}
            className="h-full w-full object-cover pointer-events-none transition-transform duration-200"
            style={{ transform: `rotate(${rotation}deg)` }}
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

      {typeof index === "number" && (
        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold">
          {index + 1}
        </div>
      )}

      {(onRotate || onDelete) && (
        <div className="absolute left-3 top-3 flex gap-1">
          {onRotate && (
            <button
              type="button"
              onPointerDown={stopForDrag}
              onClick={(e) => {
                stopForDrag(e);
                onRotate();
              }}
              disabled={actionsDisabled}
              title="Rotate page 90°"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg
                bg-black/70
                text-neutral-300
                transition
                hover:bg-neutral-800
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <i className="fa fa-rotate-right text-xs" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onPointerDown={stopForDrag}
              onClick={(e) => {
                stopForDrag(e);
                onDelete();
              }}
              disabled={actionsDisabled || deleteDisabled}
              title="Delete page"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg
                bg-black/70
                text-neutral-300
                transition
                hover:bg-red-600
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <i className="fa fa-trash text-xs" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}