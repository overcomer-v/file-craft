import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export function DownloadPage() {
  const location = useLocation();

  const pdfUrl = location.state?.url as string | undefined;
  const fileName = location.state?.downloadName as string | undefined;

  useEffect(() => {
    if (!pdfUrl) return;

    const a = document.createElement("a");

    a.href = pdfUrl;
    a.download = fileName ?? "output.pdf";

    document.body.appendChild(a);
    a.click();
    a.remove();

    return () => {
      // Only revoke if pdfUrl was created with URL.createObjectURL()
      // URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl, fileName]);

  if (!pdfUrl) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <i className="fa fa-file-pdf-o text-xl text-red-400" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Download unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            We couldn't find the PDF you were trying to download.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
          >
            <i className="fa fa-arrow-left" />
            Go back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-7 shadow-2xl shadow-black/20">

          {/* Success */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <i className="fa fa-check text-2xl text-green-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="mt-5 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Your download is ready
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Your PDF download should begin automatically.
            </p>
          </div>

          {/* File */}
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
              <i className="fa fa-file-pdf-o text-lg text-red-400" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-200">
                {fileName ?? "output.pdf"}
              </p>

              <p className="mt-0.5 text-xs text-neutral-500">
                PDF document
              </p>
            </div>
          </div>

          {/* Download */}
          <a
            href={pdfUrl}
            download={fileName ?? "output.pdf"}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 active:scale-[0.99]"
          >
            <i className="fa fa-download" />
            Download PDF
          </a>

          <p className="mt-4 text-center text-xs text-neutral-500">
            If the download didn't start, use the button above.
          </p>
        </div>
      </section>
    </main>
  );
}