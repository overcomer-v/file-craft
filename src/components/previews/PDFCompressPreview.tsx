import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionId } from "../../helpers/session.js";

import type { UploadedFile } from "../../types/itemTypes.js";
import { usePdfCompress, type CompressionLevel } from "../../hooks/useCompressPDF.js";

interface PDFCompressPreviewPageProps {
  file: UploadedFile | undefined;
}

const LEVEL_OPTIONS: {
  value: CompressionLevel;
  label: string;
  description: string;
}[] = [
  { value: "low", label: "Low", description: "Best quality, smaller savings" },
  { value: "medium", label: "Medium", description: "Balanced quality and size" },
  { value: "high", label: "High", description: "Smallest file, more quality loss" },
];

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

export function PDFCompressPreviewPage({ file }: PDFCompressPreviewPageProps) {
  const navigate = useNavigate();
  const { compressPdf, isCompressing, progress } = usePdfCompress();

  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [fileName, setFileName] = useState("");

  const sessionId = getSessionId();
  const sourceFile = file?.file;

  async function handleCompress() {
    if (!sourceFile) return;

    const result = await compressPdf(sessionId, sourceFile, level, fileName);

    if (!result) return;

    navigate("/download", {
      state: {
        url: result.url,
        downloadName: result.downloadName,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      },
    });
  }

  return (
    <main className="min-h-full bg-[#090909] text-white">
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <i className="fa fa-compress text-red-500" />
              Compress PDF
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Reduce File Size
            </h1>

            <div className="mt-3 h-1 w-10 rounded-full bg-red-500" />

            <p className="mt-3 text-sm text-neutral-500">
              Pick a compression level and we&apos;ll shrink the file.
            </p>
          </div>

          <button
            onClick={handleCompress}
            disabled={isCompressing || !sourceFile}
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg
              bg-red-600
              px-5 py-3
              text-sm font-semibold
              transition
              hover:bg-red-500
              disabled:cursor-not-allowed
              disabled:bg-neutral-800
              disabled:text-neutral-600
            "
          >
            {isCompressing ? (
              <>
                <i className="fa fa-spinner fa-spin" />
                Compressing...
              </>
            ) : (
              <>
                <i className="fa fa-file-pdf" />
                Compress PDF
              </>
            )}
          </button>
        </section>

        {/* Options */}
        <section className="mb-8 rounded-xl border border-neutral-800 bg-[#111111] p-4 md:p-5">
          <div className="flex flex-col gap-6">
            {/* Filename */}
            <div>
              <label
                htmlFor="filename"
                className="text-xs font-medium uppercase tracking-wider text-neutral-500"
              >
                Output filename
              </label>

              <input
                id="filename"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={file?.name?.replace(/\.pdf$/i, "") || "Filename"}
                className="
                  mt-2 h-11 w-full rounded-lg
                  border border-neutral-800
                  bg-[#0b0b0b]
                  px-4
                  text-sm text-white
                  outline-none
                  placeholder:text-neutral-600
                  focus:border-red-600
                  md:w-72
                "
              />
            </div>

            {/* Compression level */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Compression level
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LEVEL_OPTIONS.map((option) => {
                  const isSelected = level === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLevel(option.value)}
                      disabled={isCompressing}
                      className={`
                        rounded-lg border px-4 py-3 text-left transition
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${
                          isSelected
                            ? "border-red-600 bg-red-600/10"
                            : "border-neutral-800 bg-[#0b0b0b] hover:border-neutral-700"
                        }
                      `}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          isSelected ? "text-red-400" : "text-neutral-200"
                        }`}
                      >
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File info */}
            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
              <p className="text-sm text-neutral-400">{file?.name}</p>

              {sourceFile && (
                <span className="rounded-full border border-neutral-800 bg-[#0b0b0b] px-3 py-1.5 text-xs text-neutral-500">
                  {formatMb(sourceFile.size)}MB
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Processing */}
        {isCompressing && progress && (
          <section className="rounded-xl border border-neutral-800 bg-[#111111] p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Compressing pages...</span>

              <span className="text-neutral-500">
                {progress.current} / {progress.total}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{
                  width: `${
                    progress.total > 0
                      ? (progress.current / progress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}