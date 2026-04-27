import { data, Navigate, useNavigate, useParams } from "react-router-dom";
import { PDF_MODE, type PdfMode } from "../types/operation-types.js";
import { ImageToPdfPreviewPage } from "../components/ImageToPDFPreview.js";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { useEffect, useState } from "react";
import { getSessionId, hasSessionId } from "../helpers/session.js";
import { PdfMergePreviewPage } from "../components/PDFMergePreveiw.js";
import { PdfSplitPreview } from "../components/PDFsplitPreview.js";
import type { UploadedFile } from "../types/itemTypes.js";

export function PreviewPage() {
  const { fetchFiles } = useDBHandler();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  const { mode } = useParams<{ mode: PdfMode }>();
  const currentMode = mode && validateMode(mode) ? mode : PDF_MODE.IMAGE_TO_PDF;

  function validateMode(mode: PdfMode | undefined) {
    return Object.keys(PDF_MODE).includes(mode?.toUpperCase() || "");
  }

  if (!hasSessionId()) {
    return navigate(`/upload/${mode}`);
  }

  useEffect(() => {
    async function loadFiles() {
      const results = await fetchFiles(getSessionId(),currentMode);

      console.log(results);

      if (!results || results.totalItems === 0) {
        return navigate(`/upload/${mode}`);
      }

      const { data } = results;
      console.log("preview files", data);

      setFiles(data);
    }

    loadFiles();
  }, []);
  switch (currentMode) {
    case PDF_MODE.IMAGE_TO_PDF:
      return <ImageToPdfPreviewPage files={files} />;
    case PDF_MODE.MERGE:
      return <PdfMergePreviewPage files={files} />;
    case PDF_MODE.SPLIT:
      return <PdfSplitPreview file={files[0]?.file}/>
  }
}
