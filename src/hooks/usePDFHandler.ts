import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { db } from "../dexie.js";
import { useDBHandler } from "./useDBHandler.js";
import { clearSession } from "../helpers/session.js";

export function usePDFHandler() {
  const [isConverting, setIsConverting] = useState(false);
  const {clearDB} = useDBHandler();
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const createPDF = useCallback(
    async (sessionId: string, fileName: string, fitToImage: boolean) => {
      setIsConverting(true);
      setProgress(null);

      try {
        const records = await db.files
          .where("sessionId")
          .equals(sessionId)
          .sortBy("order");

        const total = records.length;

        if (total === 0) {
          alert("No images to convert.");
          return;
        }

        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < total; i++) {
          setProgress({ current: i + 1, total });

          const record = records[i];
          if (!record?.file) continue;

          let arrayBuffer: ArrayBuffer | null = await (
            record.file as Blob
          ).arrayBuffer();
          const type = (record.file as Blob).type;

          let image;
          if (type === "image/jpeg" || type === "image/jpg") {
            image = await pdfDoc.embedJpg(arrayBuffer);
          } else if (type === "image/png") {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else {
            console.warn(`Skipping unsupported type: ${type}`);
            arrayBuffer = null;
            continue;
          }

          const page = fitToImage
            ? pdfDoc.addPage([image.width, image.height])
            : pdfDoc.addPage();

          const { width, height } = page.getSize();

          if (fitToImage) {
            page.drawImage(image, { x: 0, y: 0, width, height });
          } else {
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

          arrayBuffer = null;
        }

        const pdfBytes = await pdfDoc.save();


        await clearDB(sessionId);
        clearSession();

        const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);

        return {
          url,
          downloadName: fileName?.trim()
            ? `${fileName.trim()}.pdf`
            : `${Date.now()}-output.pdf`,
        };
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


  const mergePDFs = useCallback(
  async (pdfFiles: Blob[], fileName: string) => {
    setIsConverting(true);
    setProgress(null);

    console.log(pdfFiles);

    try {
      if (!pdfFiles.length) {
        alert("No PDF files to merge.");
        return;
      }

      const mergedPdf = await PDFDocument.create();
      const total = pdfFiles.length;

      for (let i = 0; i < total; i++) {
        setProgress({ current: i + 1, total });

        const file = pdfFiles[i];
        if (!file) continue;

        let arrayBuffer: ArrayBuffer | null = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        for (const page of pages) {
          mergedPdf.addPage(page);
        }

        arrayBuffer = null;
      }

      const mergedBytes = await mergedPdf.save();

      const blob = new Blob([mergedBytes as Uint8Array<ArrayBuffer>], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      return {
        url,
        downloadName: fileName?.trim()
          ? `${fileName.trim()}.pdf`
          : `${Date.now()}-merged.pdf`,
      };
    } catch (error) {
      console.error("PDF merge failed:", error);
      alert("Failed to merge PDFs. Check console for details.");
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  },
  [],
);


  return { createPDF, isConverting, progress, mergePDFs };
}
