// types/reorder.ts
export type ReorderItemType = "image" | "pdf";

export interface ReorderItem {
  id: string;
  order: number;
  dbKey: number;
  type: ReorderItemType;
  file: File | Blob;
  previewUrl: string;
  label: string;
  meta?: {
    pageCount?: number;
  };
}
