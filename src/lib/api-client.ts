import { createClient } from "@/lib/supabase/client";
import type { HealthResponse } from "@/types/api";
import type { Document, DocumentListResponse, UploadDocumentResponse, } from "@/types/document";
import type { QueryResponse } from "@/types/query";
function getApiBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
    }
    return url;
}
const API_BASE_URL = getApiBaseUrl();
const supabase = createClient();
class JuristaAPIClient {
    private async getAuthToken(): Promise<string> {
        const { data: { session }, } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("User not authenticated");
        }
        return session.access_token;
    }
    async uploadDocument(file: File): Promise<UploadDocumentResponse> {
        const token = await this.getAuthToken();
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload document");
        }
        return await response.json();
    }
    async listDocuments(): Promise<DocumentListResponse> {
        const token = await this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch documents");
        }
        return await response.json();
    }
    async getDocument(documentId: string): Promise<{
        document: Document;
    }> {
        const token = await this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch document");
        }
        return await response.json();
    }
    async deleteDocument(documentId: string): Promise<{
        message: string;
    }> {
        const token = await this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete document");
        }
        return await response.json();
    }
    async queryDocument(documentId: string, question: string, maxContextChunks = 5): Promise<QueryResponse> {
        const token = await this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/query`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                documentId,
                question,
                maxContextChunks,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to query document");
        }
        return await response.json();
    }
    async checkHealth(): Promise<HealthResponse> {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error("API is not healthy");
        }
        return await response.json();
    }
}
export const api = new JuristaAPIClient();
