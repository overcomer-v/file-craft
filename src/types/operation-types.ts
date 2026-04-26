export const PDF_MODE = {
  MERGE: "merge",
  SPLIT: "split",
  IMAGE_TO_PDF: "convert",
  COMPRESS: "compress",
} as const;

export type PdfMode = (typeof PDF_MODE)[keyof typeof PDF_MODE];
