export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface Document {
  id: string;
  userId: string;
  filename: string;
  storagePath: string;
  status: DocumentStatus;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface UploadDocumentResponse {
  documentId: string;
  filename: string;
  chunksCount: number;
  embeddingsCount: number;
  message: string;
}
