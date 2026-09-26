import { useState } from "react";
import type { UploadedFile } from "../../types/itemTypes.js";
import { usePdfToImages, type ImageFormat } from "../../hooks/usePDFtoImages.js";
import { getSessionId } from "../../helpers/session.js";


interface PDFToImagesPreviewPageProps {
  file?: File | undefined;
}

const FORMAT_OPTIONS: {
  value: ImageFormat;
  label: string;
  description: string;
}[] = [
  { value: "png", label: "PNG", description: "Lossless, best for text and graphics" },
  { value: "jpeg", label: "JPEG", description: "Smaller files, adjustable quality" },
];

const RESOLUTION_OPTIONS: {
  value: number;
  label: string;
  description: string;
}[] = [
  { value: 1, label: "Standard", description: "Good for screens and sharing" },
  { value: 2, label: "High", description: "Sharper detail, larger files" },
  { value: 3, label: "Print", description: "Best quality for printing" },
];

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

export function PDFToImagesPreviewPage({ file }: PDFToImagesPreviewPageProps) {
  const { convertToImages, isConverting, progress } = usePdfToImages();

  const [format, setFormat] = useState<ImageFormat>("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.85);
  const [hasConverted, setHasConverted] = useState(false);

  const sessionId = getSessionId();
  const sourceFile = file;

  async function handleConvert() {
    if (!sourceFile) return;

    setHasConverted(false);

    await convertToImages(sessionId, sourceFile, { format, scale, quality });

    // convertToImages downloads each page directly rather than returning a
    // single result — it resolves whether or not every page succeeded (it
    // alerts internally on failure), so this just marks the run as finished
    // rather than confirming success.
    setHasConverted(true);
  }

  function updateFormat(next: ImageFormat) {
    setFormat(next);
    setHasConverted(false);
  }

  function updateScale(next: number) {
    setScale(next);
    setHasConverted(false);
  }

  function updateQuality(next: number) {
    setQuality(next);
    setHasConverted(false);
  }

  return (
    <main className="min-h-full bg-[#090909] text-white">
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
              <i className="fa fa-images text-red-500" />
              PDF to Images
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Export Pages as Images
            </h1>

            <div className="mt-3 h-1 w-10 rounded-full bg-red-500" />

            <p className="mt-3 text-sm text-neutral-500">
              Choose a format and resolution, then download every page as an
              image.
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={isConverting || !sourceFile}
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
            {isConverting ? (
              <>
                <i className="fa fa-spinner fa-spin" />
                Converting...
              </>
            ) : (
              <>
                <i className="fa fa-download" />
                Convert &amp; Download
              </>
            )}
          </button>
        </section>

        {/* Options */}
        <section className="mb-8 rounded-xl border border-neutral-800 bg-[#111111] p-4 md:p-5">
          <div className="flex flex-col gap-6">
            {/* Format */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Image format
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FORMAT_OPTIONS.map((option) => {
                  const isSelected = format === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormat(option.value)}
                      disabled={isConverting}
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

            {/* JPEG quality */}
            {format === "jpeg" && (
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="quality"
                    className="text-xs font-medium uppercase tracking-wider text-neutral-500"
                  >
                    JPEG quality
                  </label>

                  <span className="text-xs text-neutral-400">
                    {Math.round(quality * 100)}%
                  </span>
                </div>

                <input
                  id="quality"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => updateQuality(Number(e.target.value))}
                  disabled={isConverting}
                  className="mt-3 w-full accent-red-600"
                />
              </div>
            )}

            {/* Resolution */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Resolution
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {RESOLUTION_OPTIONS.map((option) => {
                  const isSelected = scale === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateScale(option.value)}
                      disabled={isConverting}
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
        {isConverting && progress && (
          <section className="mb-6 rounded-xl border border-neutral-800 bg-[#111111] p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Converting page {progress.current} of {progress.total}...
              </span>

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

        {/* Done */}
        {!isConverting && hasConverted && (
          <section className="rounded-xl border border-neutral-800 bg-[#111111] p-4">
            <div className="flex items-center gap-3">
              <i className="fa fa-check-circle text-red-500" />

              <p className="text-sm text-neutral-300">
                Done — each page was downloaded as a separate image.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}