import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { db } from "../dexie.js";

export function usePDFHandler() {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const createPDF = useCallback(
    async (fileName: string, fitToImage: boolean) => {
      setIsConverting(true);
      setProgress(null);

      try {
        // 1. Fetch only IDs and order — no Blobs in memory yet
        const records = (await db.files
          .orderBy("order")
          .primaryKeys()) as number[];
        const total = records.length;

        if (total === 0) {
          alert("No images to convert.");
          return;
        }

        const pdfDoc = await PDFDocument.create();

        // 2. Process one file at a time to keep RAM flat
        for (let i = 0; i < total; i++) {
          setProgress({ current: i + 1, total });

          // Fetch a single record by primary key
          const record = await db.files.get(records[i]);
          if (!record?.file) continue;

          // Convert Blob → ArrayBuffer → embed

          let arrayBuffer = await (record.file as Blob).arrayBuffer();

          let image;
          const type = (record.file as Blob).type;

          if (type === "image/jpeg" || type === "image/jpg") {
            image = await pdfDoc.embedJpg(arrayBuffer);
          } else if (type === "image/png") {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else {
            console.warn(`Skipping unsupported type: ${type}`);
            continue;
          }

          const page = fitToImage
            ? pdfDoc.addPage([image.width, image.height]) // page sized to image
            : pdfDoc.addPage(); // standard A4

          const { width, height } = page.getSize();

          if (fitToImage) {
            // Image fills the page exactly
            page.drawImage(image, { x: 0, y: 0, width, height });
          } else {
            // Scale image to fit within the page, preserving aspect ratio
            const scale = Math.min(width / image.width, height / image.height);
            const scaledW = image.width * scale;
            const scaledH = image.height * scale;
            page.drawImage(image, {
              x: (width - scaledW) / 2,
              y: (height - scaledH) / 2,
              width: scaledW,
              height: scaledH,
            });
          }

          // 3. Explicitly null the buffer so GC can reclaim it before next iteration
          // @ts-ignore
          arrayBuffer = null;
        }

        // 4. Serialize and trigger download
        const pdfBytes = await pdfDoc.save();

        await db.files.clear();

        const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);

        return {
          url,
          downloadName: fileName?.trim() ? `${fileName.trim()}.pdf` : "output.pdf",
        };

        // const a = document.createElement("a");
        // a.href = url;
        // a.download = fileName?.trim() ? `${fileName.trim()}.pdf` : "output.pdf";
        // a.click();

        // URL.revokeObjectURL(url);
      } catch (error) {
        console.error("PDF creation failed:", error);
        alert("Failed to create PDF. Check console for details.");
      } finally {
        setIsConverting(false);
        setProgress(null);
      }
    },
    [],
  );

  return { createPDF, isConverting, progress };
}

// import { useNavigate } from "react-router-dom";
// import { BACKEND_URL } from "../helpers/constants.js";
// import { useState } from "react";

// export function usePDFHandler() {
//   const navigate = useNavigate();
//     const [isConverting, setIsConverting] = useState<boolean>(false);

//   async function createPDF(
//     fileName: string,
//     fitToImage: boolean,
//     orderedImages: any,
//   ) {
//     try{
//     console.log("ordered Images", orderedImages);
//         const sessionId = localStorage.getItem('pdf_monger_session_id');

//         if (!sessionId) {
//           return
//         }
// setIsConverting(true);
//     const res = await fetch(`${BACKEND_URL}/pdf/create`, {
//       method: "POST",
//       credentials: "include",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         filename: fileName,
//         pageMode: fitToImage ? "fit" : "no-fit",
//         orderedImages,
//         sessionId,
//       }),
//     });

//     if (res.ok) {
//       const data = await res.json();
//      navigate(`/download-page?url=${encodeURIComponent(data.pdf_url)}`)
//     } else {
//       console.error("PDF generation failed:", await res.json());
//     }
//   }catch(error){
//     throw error;
//   }finally{
//     setIsConverting(false);
//   }}

//   return { createPDF, isConverting };
// }
