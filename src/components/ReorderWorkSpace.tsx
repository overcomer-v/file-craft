import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReorderItem } from "../types/reorder.js";
import { SortablePreviewCard } from "./SortableCard.js";
import { Paginator } from "./Pagenator.js";

interface ReorderWorkspaceProps<T extends ReorderItem> {
  items: T[];
  pageSize?: number;
  onOrderChange?: (items: T[]) => void;
  orderedItems: T[];
  setOrderedItems: (items: T[]) => void;
  // Edit-only, all optional: a caller that doesn't pass these (e.g. a
  // future image-to-pdf usage of this same workspace) gets no rotate/delete
  // UI at all — see BasePreviewCards, which only renders those buttons when
  // the corresponding handler is actually provided.
  rotations?: Record<string, number>;
  onRotateItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  disabled?: boolean;
}

export function ReorderWorkspace<T extends ReorderItem>({
  items,
  pageSize = 30,
  orderedItems,
  onOrderChange,
  setOrderedItems,
  rotations,
  onRotateItem,
  onDeleteItem,
  disabled,
}: ReorderWorkspaceProps<T>) {
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

  useEffect(() => {
    if (pageNo > totalPages) {
      setPageNo(totalPages);
    }
  }, [pageNo, totalPages]);

  const pageItems = useMemo(() => {
    const start = (pageNo - 1) * pageSize;
    return orderedItems.slice(start, start + pageSize);
  }, [orderedItems, pageNo, pageSize]);

  function handleDragEnd(event: DragEndEvent) {
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
    <main className="w-full">
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
                  rotation={rotations?.[item.id] ?? 0}
                  onRotate={
                    onRotateItem ? () => onRotateItem(item.id) : undefined
                  }
                  onDelete={
                    onDeleteItem ? () => onDeleteItem(item.id) : undefined
                  }
                  deleteDisabled={orderedItems.length <= 1}
                  actionsDisabled={disabled}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>

      {orderedItems.length > 0 && (
        <Paginator
          total={orderedItems.length}
          limit={pageSize}
          currentPage={pageNo}
          onPageChange={setPageNo}
        />
      )}
    </main>
  );
}