import { useState } from "react";
import { BACKEND_URL } from "../helpers/constants.js";

export function useFileHandler() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function uploadImages(files: File[]) {
    try {
      if (files.length === 0 || !files) {
        return;
      }
      setIsLoading(true);
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`${BACKEND_URL}/uploads`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      localStorage.setItem('pdf_monger_session_id', data.sessionID);

      console.log("data :", data);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function getImagesPreview(pageNo = 1, limit = 15) {
  try {
    const sessionId = localStorage.getItem('pdf_monger_session_id');

    console.log(sessionId)

    if (!sessionId) throw new Error('No active session');

    setIsLoading(true)

    const params = new URLSearchParams({
      sessionId,
      pageNo: pageNo.toString(),
      limit: limit.toString(),
    });

    const res = await fetch(`${BACKEND_URL}/uploads/preview?${params.toString()}`);
    const payload = await res.json();

    if (!res.ok) throw new Error(payload.error || 'Something went wrong');

    return {
      data: payload.data,       // [{ id, url, order, originalName }]
      totalItems: payload.meta.total,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }finally{
    setIsLoading(false);
  }
}
  return { uploadImages, isLoading, getImagesPreview };
}
