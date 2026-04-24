import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function DownloadPage() {
  const location = useLocation();
  const pdfUrl = location.state?.url as string | undefined;
  const fileName = location.state?.downloadName as string | undefined;

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!pdfUrl) {
    return (
      <div className="w-full h-screen grid place-items-center">
        <p>PDF link is missing.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <a
        className="absolute left-1/3 md:left-1/2 top-1/3 bg-white rounded-md px-5 py-2 text-black drop-shadow-md"
        href={pdfUrl}
        download={fileName ?? "output.pdf"}
      >
        Download PDF
      </a>
    </div>
  );
}
