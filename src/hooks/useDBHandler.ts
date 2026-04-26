import { useState } from "react";
import { db } from "../dexie.js";
import { PDF_MODE, type PdfMode } from "../types/operation-types.js";

export function useDBHandler() {
  const [isfileUploading, setIsFileUploading] = useState<boolean>();
  const [isfileloading, setIsFileLoading] = useState<boolean>();

  const uploadFiles = async (fileList: File[], sessionId: string) => {
    try {
      setIsFileUploading(true);
      if (!fileList?.length) return;

      const data = Array.from(fileList).map((file, index) => ({
        file,
        name: file.name,
        type: file.type,
        order: index,
        sessionId: sessionId,
      }));

      await clearDB(sessionId);
      await db.files.bulkAdd(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFileUploading(false);
    }
  };

  const fetchFiles = async (sessionId: string, mode: PdfMode) => {
    try {
      setIsFileLoading(true);

      const files: any[] = await db.files
        .where("sessionId")
        .equals(sessionId)
        .sortBy("order");

      const filteredFiles = files.filter((file) => {
        if (mode === PDF_MODE.IMAGE_TO_PDF) {
          return file.type.startsWith("image/");
        }

        if (
          mode === PDF_MODE.MERGE ||
          mode === PDF_MODE.SPLIT ||
          mode === PDF_MODE.COMPRESS
        ) {
          return file.type === "application/pdf";
        }

        return false;
      });

      return { totalItems: filteredFiles.length, data: filteredFiles };
    } catch (error) {
      console.error(error);
    } finally {
      setIsFileLoading(false);
    }
  };

  async function clearDB(sessionId: string) {
    return await db.files.where("sessionId").equals(sessionId).delete();
  }

  return { uploadFiles, isfileUploading, fetchFiles, isfileloading, clearDB };
}
