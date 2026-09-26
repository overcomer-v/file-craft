import { data, Navigate, useNavigate, useParams } from "react-router-dom";
import { PDF_MODE, type PdfMode } from "../types/operation-types.js";
import { ImageToPdfPreviewPage } from "../components/previews/ImageToPDFPreview.js";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { useEffect, useState } from "react";
import { getSessionId, hasSessionId } from "../helpers/session.js";
import { PdfMergePreviewPage } from "../components/previews/PDFMergePreveiw.js";
import { PdfSplitPreview } from "../components/previews/PDFsplitPreview.js";
import type { UploadedFile } from "../types/itemTypes.js";
import { PDFCompressPreviewPage } from "../components/previews/PDFCompressPreview.js";
import { EditPdfPreviewPage } from "../components/previews/PDFEditPreview.js";
import { PDFToImagesPreviewPage } from "../components/previews/PDFtoImagesPreview.js";

export function PreviewPage() {
  const { fetchFiles } = useDBHandler();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  const { mode } = useParams<{ mode: PdfMode }>();
  const currentMode = mode && validateMode(mode) ? mode : PDF_MODE.IMAGE_TO_PDF;

  console.log("preview",mode, currentMode);

 function validateMode(mode: string | undefined): mode is PdfMode {
  return Object.values(PDF_MODE).includes(mode as PdfMode);
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
        case PDF_MODE.EDIT_PDF:
      return <EditPdfPreviewPage file={files[0]?.file}/>
      case PDF_MODE.PDF_TO_IMAGES:
      return <PDFToImagesPreviewPage file={files[0]?.file}/>
    case PDF_MODE.COMPRESS:
      return <PDFCompressPreviewPage file={files[0]} />
  }
}
