import { useState } from "react";
import { db } from "../dexie.js";

export function useDBHandler() {
  const [isfileUploading, setIsFileUploading] = useState<boolean>();
  const [isfileloading, setIsFileLoading] = useState<boolean>();

  const uploadFiles = async (fileList: File[]) => {
    try {
      setIsFileUploading(true);
      if (!fileList?.length) return;

      const data = Array.from(fileList).map((file, index) => ({
        file,
        name: file.name,
        type: file.type,
        order: index,
      }));

      await db.files.clear();
      await db.files.bulkAdd(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFileUploading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      setIsFileLoading(true);
      const files: any[] = await db.files.orderBy("order").toArray();

      return { totalItems: files.length, data: files };
    } catch (error) {
      console.error(error);
    } finally {
      setIsFileLoading(false);
    }
  };

  return { uploadFiles, isfileUploading, fetchFiles, isfileloading };
}
