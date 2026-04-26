import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { getSessionId } from "../helpers/session.js";
import { PDF_MODE, type PdfMode } from "../types/operation-types.js";

const MOBILE_LIMIT_MB = 100;
const DESKTOP_LIMIT_MB = 250;
const MOBILE_LIMIT_BYTES = MOBILE_LIMIT_MB * 1024 * 1024;
const DESKTOP_LIMIT_BYTES = DESKTOP_LIMIT_MB * 1024 * 1024;

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { uploadFiles } = useDBHandler();
  const { mode } = useParams<{ mode: PdfMode }>();
  const currentMode = mode && validateMode(mode) ? mode : PDF_MODE.IMAGE_TO_PDF;

  const isMobile = isMobileDevice();
  const maxTotalSize = isMobile ? MOBILE_LIMIT_BYTES : DESKTOP_LIMIT_BYTES;
  const maxTotalSizeMb = isMobile ? MOBILE_LIMIT_MB : DESKTOP_LIMIT_MB;

  const totalSelectedSize = files.reduce((sum, file) => sum + file.size, 0);
  const hasFiles = files.length > 0;
  const canUpload = hasFiles && !errorMessage;

  function validateMode(mode: PdfMode | undefined) {
    return Object.keys(PDF_MODE).includes(mode?.toUpperCase() || "");
  }

  async function handleUpload() {
    try {
      if (!canUpload) return;
      await uploadFiles(files, getSessionId());
      navigate(`/preview/${mode}`);
    } catch (error) {
      alert(error);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = [...(e.target.files ?? [])];
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxTotalSize) {
      setFiles([]);
      setErrorMessage(
        `Selected files are ${formatMb(totalSize)}MB. Maximum allowed on ${isMobile ? "mobile" : "desktop"} is ${maxTotalSizeMb}MB.`,
      );
      e.target.value = "";
      return;
    }

    setFiles(selectedFiles);
    setErrorMessage("");
  }

  const title = {
    [PDF_MODE.IMAGE_TO_PDF]: "Image to",
    [PDF_MODE.SPLIT]: "Split",
    [PDF_MODE.MERGE]: "Merge",
    [PDF_MODE.COMPRESS]: "Compress",
  };

  const accept = {
    [PDF_MODE.IMAGE_TO_PDF]: "image/png,image/jpeg",
    [PDF_MODE.MERGE]: ".pdf",
    [PDF_MODE.SPLIT]: ".pdf",
    [PDF_MODE.COMPRESS]: ".pdf",
  };

  const isMultiple = mode === PDF_MODE.IMAGE_TO_PDF || mode === PDF_MODE.MERGE;

  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="md:mt-28 mt-24 flex flex-col items-center">
        <div className="flex-col flex md:gap-3 gap-1 text-center">
          <p className="md:text-6xl text-5xl">
            {title[currentMode] || ""}{" "}
            <span className="text-red-600 font-semibold">PDF</span>
          </p>
          <p className="md:text-4xl text-2xl md:mt-3 font-thin">
            Fast. Simple. Secure
          </p>
        </div>

        <input
          accept={accept[currentMode]}
          type="file"
          multiple={isMultiple}
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col justify-center items-center text-center md:h-[9rem] h-[8rem] md:px-16 px-10 relative border-dashed border-[2px] rounded-xl md:mt-16 mt-10 border-neutral-700">
          {hasFiles && (
            <div className="text-sm absolute md:top-4 top-3 font-semibold w-full">
              <p>{`${files.length} files selected`}</p>
              {/* <p className="text-xs font-normal text-neutral-500">
                Total size: {formatMb(totalSelectedSize)}MB
              </p> */}
            </div>
          )}

          <button
            onClick={() => {
              if (hasFiles) {
                handleUpload();
              } else {
                inputRef.current?.click();
              }
            }}
            disabled={hasFiles && !canUpload}
            className={`md:py-4 md:px-8 py-3 px-6 font-semibold rounded-lg ${
              hasFiles && !canUpload
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                : "bg-neutral-50 text-black"
            }`}
          >
            <span className="text-sm font-semibold">
              {hasFiles ? "Upload files" : "Select Files"}
            </span>{" "}
            <i className="fa fa-cloud-upload text-red-600"></i>
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Max total upload size on {isMobile ? "mobile" : "desktop"} is{" "}
          {maxTotalSizeMb}MB.
        </p>

        {hasFiles && (
          <p className="mt-1 text-xs text-neutral-500">
            Current selection: {formatMb(totalSelectedSize)}MB /{" "}
            {maxTotalSizeMb}MB
          </p>
        )}

        {errorMessage && (
          <p className="mt-2 max-w-sm text-center text-xs text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
