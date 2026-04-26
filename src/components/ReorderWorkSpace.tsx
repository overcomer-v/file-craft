// components/ReorderWorkspace.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReorderItem } from "../types/reorder.js";
import { SortablePreviewCard } from "./SortableCard.js";

interface ReorderWorkspaceProps {
  items: ReorderItem[];
  pageSize?: number;
  onOrderChange?: (items: ReorderItem[]) => void;
  orderedItems: ReorderItem[];
  setOrderedItems: (items: ReorderItem[]) => void;
}

export function ReorderWorkspace({
  items,
  pageSize = 15,
  orderedItems,
  onOrderChange,
  setOrderedItems,
}: ReorderWorkspaceProps) {
  const [pageNo, setPageNo] = useState(1);

  useEffect(() => {
    setOrderedItems(items);
  }, [items, setOrderedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const totalPages = Math.max(1, Math.ceil(orderedItems.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (pageNo - 1) * pageSize;
    return orderedItems.slice(start, start + pageSize);
  }, [orderedItems, pageNo, pageSize]);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedItems, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        order: index,
      }),
    );

    setOrderedItems(next);
    onOrderChange?.(next);
  }

  return (
    <main className=" w-full">
      <section className="mb-12 flex flex-wrap gap-4">
        {orderedItems.length === 0 ? (
          <p className="my-[15vh] text-neutral-400">No files found.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pageItems.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              {pageItems.map((item, index) => (
                <SortablePreviewCard
                  key={item.id}
                  item={item}
                  index={(pageNo - 1) * pageSize + index}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>

      <div className="flex items-center justify-center gap-4">
        <button
          disabled={pageNo === 1}
          onClick={() => setPageNo((p) => Math.max(1, p - 1))}
          className="rounded bg-neutral-800 px-4 py-2 disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm text-neutral-300">
          Page {pageNo} of {totalPages}
        </span>

        <button
          disabled={pageNo === totalPages}
          onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
          className="rounded bg-neutral-800 px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
}
