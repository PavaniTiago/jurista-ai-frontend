import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDocumentQuery } from "../use-document-query";
import { api } from "@/lib/api-client";
vi.mock("@/lib/api-client", () => ({
    api: {
        queryDocument: vi.fn(),
    },
}));
describe("useDocumentQuery", () => {
    const documentId = "test-doc-123";
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("should initialize with empty state", () => {
        const { result } = renderHook(() => useDocumentQuery(documentId));
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.answer).toBeNull();
        expect(result.current.sources).toEqual([]);
    });
    it("should query document successfully", async () => {
        const mockResponse = {
            answer: "This is the answer",
            sources: [
                {
                    content: "Source content",
                    page: 1,
                    score: 0.9,
                },
            ],
        };
        (api.queryDocument as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
        const { result } = renderHook(() => useDocumentQuery(documentId));
        await act(async () => {
            await result.current.query("What is this?");
        });
        expect(result.current.answer).toBe("This is the answer");
        expect(result.current.sources).toEqual(mockResponse.sources);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(api.queryDocument).toHaveBeenCalledWith(documentId, "What is this?");
    });
    it("should set loading state during query", async () => {
        let resolveQuery: (value: any) => void;
        const queryPromise = new Promise((resolve) => {
            resolveQuery = resolve;
        });
        (api.queryDocument as ReturnType<typeof vi.fn>).mockReturnValue(queryPromise as any);
        const { result } = renderHook(() => useDocumentQuery(documentId));
        act(() => {
            result.current.query("What is this?");
        });
        expect(result.current.loading).toBe(true);
        await act(async () => {
            resolveQuery!({
                answer: "Answer",
                sources: [],
            });
            await queryPromise;
        });
        expect(result.current.loading).toBe(false);
    });
    it("should handle query errors", async () => {
        const error = new Error("Query failed");
        (api.queryDocument as ReturnType<typeof vi.fn>).mockRejectedValue(error);
        const { result } = renderHook(() => useDocumentQuery(documentId));
        await act(async () => {
            await result.current.query("What is this?");
        });
        expect(result.current.error).toBe("Query failed");
        expect(result.current.answer).toBeNull();
        expect(result.current.loading).toBe(false);
    });
    it("should reset state", async () => {
        const mockResponse = {
            answer: "Answer",
            sources: [{ content: "Source", page: 1, score: 0.9 }],
        };
        (api.queryDocument as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
        const { result } = renderHook(() => useDocumentQuery(documentId));
        await act(async () => {
            await result.current.query("What is this?");
        });
        expect(result.current.answer).toBe("Answer");
        act(() => {
            result.current.reset();
        });
        expect(result.current.answer).toBeNull();
        expect(result.current.sources).toEqual([]);
        expect(result.current.error).toBeNull();
    });
    it("should handle non-Error exceptions", async () => {
        (api.queryDocument as ReturnType<typeof vi.fn>).mockRejectedValue("String error");
        const { result } = renderHook(() => useDocumentQuery(documentId));
        await act(async () => {
            await result.current.query("What is this?");
        });
        expect(result.current.error).toBe("Erro ao consultar documento");
    });
});
