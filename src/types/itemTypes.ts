export interface UploadedFile {
  id: string;
  file:File;
  name: string;
  type: string;
  order: number;
  sessionId: string;
}
