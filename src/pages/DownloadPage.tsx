import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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
      URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl, fileName]);

  if (!pdfUrl) {
    return (
      <div className="w-full h-screen grid place-items-center">
        <p>PDF link is missing.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen grid place-items-center">
      <a
        className="bg-white rounded-md px-5 py-2 text-black drop-shadow-md"
        href={pdfUrl}
        download={fileName ?? "output.pdf"}
      >
        Download PDF
      </a>
    </div>
  );
}
