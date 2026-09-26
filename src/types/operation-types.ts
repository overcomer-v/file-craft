export const PDF_MODE = {
  MERGE: "merge",
  SPLIT: "split",
  IMAGE_TO_PDF: "convert",
  COMPRESS: "compress",
  EDIT_PDF:"edit",
  PDF_TO_IMAGES:"pdf_to_images",
} as const;

export type PdfMode = (typeof PDF_MODE)[keyof typeof PDF_MODE];
