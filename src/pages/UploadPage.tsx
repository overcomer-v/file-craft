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

  function validateMode(mode: string | undefined): mode is PdfMode {
    return Object.values(PDF_MODE).includes(mode as PdfMode);
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
        `Selected files are ${formatMb(totalSize)}MB. Maximum allowed on ${
          isMobile ? "mobile" : "desktop"
        } is ${maxTotalSizeMb}MB.`,
      );

      e.target.value = "";
      return;
    }

    setFiles(selectedFiles);
    setErrorMessage("");
  }

  // { prefix, emphasis } instead of one flat string: some modes read
  // "<prefix> PDF" (Split PDF, Edit PDF) and some read the other way
  // around ("PDF to Images"), so the emphasized word can't always be
  // assumed to trail the phrase.
  const heading: Record<PdfMode, { prefix: string; emphasis: string }> = {
    [PDF_MODE.IMAGE_TO_PDF]: { prefix: "Image to", emphasis: "PDF" },
    [PDF_MODE.SPLIT]: { prefix: "Split", emphasis: "PDF" },
    [PDF_MODE.MERGE]: { prefix: "Merge", emphasis: "PDF" },
    [PDF_MODE.COMPRESS]: { prefix: "Compress", emphasis: "PDF" },
    [PDF_MODE.EDIT_PDF]: { prefix: "Edit", emphasis: "PDF" },
    [PDF_MODE.PDF_TO_IMAGES]: { prefix: "PDF to", emphasis: "Images" },
  };

  const description: Record<PdfMode, string> = {
    [PDF_MODE.IMAGE_TO_PDF]: "Convert your images into a PDF.",
    [PDF_MODE.SPLIT]: "Split a PDF into separate files.",
    [PDF_MODE.MERGE]: "Combine multiple PDFs into one document.",
    [PDF_MODE.COMPRESS]: "Reduce the size of your PDF.",
    [PDF_MODE.EDIT_PDF]: "Delete, rearrange, and rotate pages in your PDF.",
    [PDF_MODE.PDF_TO_IMAGES]: "Export each page of your PDF as an image.",
  };

  const accept: Record<PdfMode, string> = {
    [PDF_MODE.IMAGE_TO_PDF]: "image/png,image/jpeg",
    [PDF_MODE.MERGE]: ".pdf",
    [PDF_MODE.SPLIT]: ".pdf",
    [PDF_MODE.COMPRESS]: ".pdf",
    [PDF_MODE.EDIT_PDF]: ".pdf",
    [PDF_MODE.PDF_TO_IMAGES]: ".pdf",
  };

  // Per-mode copy for the empty upload-area state. Was a growing
  // currentMode === X ? ... : isMultiple ? ... : ... ternary; moved to a
  // map once a second special case (this one) needed adding.
  const uploadCopy: Record<PdfMode, { title: string; subtitle: string }> = {
    [PDF_MODE.IMAGE_TO_PDF]: {
      title: "Select your files",
      subtitle: "Choose one or more files to continue",
    },
    [PDF_MODE.MERGE]: {
      title: "Select your files",
      subtitle: "Choose one or more files to continue",
    },
    [PDF_MODE.SPLIT]: {
      title: "Select your files",
      subtitle: "Choose a file to continue",
    },
    [PDF_MODE.COMPRESS]: {
      title: "Select your files",
      subtitle: "Choose a file to continue",
    },
    [PDF_MODE.EDIT_PDF]: {
      title: "Select a PDF to edit",
      subtitle: "Choose a PDF to rearrange, rotate, or delete pages",
    },
    [PDF_MODE.PDF_TO_IMAGES]: {
      title: "Select a PDF to convert",
      subtitle: "Choose a PDF to export as image files",
    },
  };

  const isMultiple = mode === PDF_MODE.IMAGE_TO_PDF || mode === PDF_MODE.MERGE;

  return (
    <main className="min-h-full w-full bg-[#090909] text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-12 pb-24 md:pt-28">
        {/* Heading */}
        <div className="text-center">
          <div className="mb-5 inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5">
            <span className="text-xs font-medium uppercase tracking-widest text-red-500">
              PDF Tool
            </span>
          </div>

          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            {heading[currentMode].prefix}{" "}
            <span className="text-red-500">
              {heading[currentMode].emphasis}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-neutral-500 md:text-lg">
            {description[currentMode]}
          </p>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept[currentMode]}
          multiple={isMultiple}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload area */}
        <div
          className="
            mt-12 w-full
            rounded-2xl
            border border-dashed border-neutral-700
            bg-[#111111]
            p-5
            transition-colors
            hover:border-neutral-600
            md:mt-16
            md:p-8
          "
        >
          <div
            className="
              flex min-h-[270px]
              flex-col items-center justify-center
              rounded-xl
              border border-neutral-800
              bg-[#0d0d0d]
              px-6
              text-center
            "
          >
            {/* Upload icon */}
            <div
              className="
                flex h-16 w-16
                items-center justify-center
                rounded-2xl
                bg-red-500/10
                ring-1 ring-red-500/10
              "
            >
              <i
                className="fa fa-cloud-upload text-2xl text-red-500"
                aria-hidden="true"
              />
            </div>

            {/* File state */}
            {hasFiles ? (
              <div className="mt-6">
                <p className="text-lg font-semibold text-white">
                  {files.length} {files.length === 1 ? "file" : "files"}{" "}
                  selected
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {formatMb(totalSelectedSize)}MB of {maxTotalSizeMb}MB
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-lg font-semibold text-white">
                  {uploadCopy[currentMode].title}
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {uploadCopy[currentMode].subtitle}
                </p>
              </div>
            )}

            {/* Action */}
            <button
              type="button"
              onClick={() => {
                if (hasFiles) {
                  handleUpload();
                } else {
                  inputRef.current?.click();
                }
              }}
              disabled={hasFiles && !canUpload}
              className="
                mt-7
                inline-flex items-center gap-2
                rounded-xl
                bg-red-500
                px-6 py-3
                text-sm font-semibold text-white
                transition-all duration-200
                hover:bg-red-400
                hover:shadow-[0_0_25px_rgba(239,68,68,0.15)]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:bg-neutral-800
                disabled:text-neutral-500
              "
            >
              {hasFiles
                ? "Upload files"
                : currentMode === PDF_MODE.IMAGE_TO_PDF
                  ? "Select images"
                  : "Select PDF"}

              <i className="fa fa-arrow-right text-xs" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Upload information */}
        <div className="mt-4 flex w-full flex-col items-center gap-1 text-center">
          <p className="text-xs text-neutral-600">
            Maximum total upload size:{" "}
            <span className="text-neutral-400">{maxTotalSizeMb}MB</span> on{" "}
            {isMobile ? "mobile" : "desktop"}.
          </p>

          {hasFiles && (
            <p className="text-xs text-neutral-600">
              Current selection:{" "}
              <span className="text-neutral-400">
                {formatMb(totalSelectedSize)}MB
              </span>
            </p>
          )}

          {errorMessage && (
            <p className="mt-2 max-w-md text-xs leading-5 text-red-500">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}