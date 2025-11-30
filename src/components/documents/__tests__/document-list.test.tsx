import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import { DocumentList } from "../document-list";
import { useDocuments } from "@/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
vi.mock("@/hooks/use-documents", () => ({
    useDocuments: vi.fn(),
    useDeleteDocument: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}));
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(),
}));
describe("DocumentList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
            auth: {},
        } as any);
    });
    it("should show loading skeleton when loading", () => {
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        } as any);
        render(<DocumentList />);
        const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });
    it("should show error message when error occurs", () => {
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error("Failed to load"),
        } as any);
        render(<DocumentList />);
        expect(screen.getByText("Erro ao carregar documentos")).toBeInTheDocument();
    });
    it("should show empty state when no documents", () => {
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { documents: [] },
            isLoading: false,
            error: null,
        } as any);
        render(<DocumentList />);
        expect(screen.getByText("Nenhum documento encontrado")).toBeInTheDocument();
        expect(screen.getByText("Comece enviando seu primeiro documento jurídico")).toBeInTheDocument();
    });
    it("should render document cards when documents exist", async () => {
        const mockDocuments = [
            {
                id: "doc-1",
                filename: "test1.pdf",
                status: "completed" as const,
                fileSize: 1024,
                createdAt: new Date().toISOString(),
            },
            {
                id: "doc-2",
                filename: "test2.pdf",
                status: "pending" as const,
                fileSize: 2048,
                createdAt: new Date().toISOString(),
            },
        ];
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { documents: mockDocuments },
            isLoading: false,
            error: null,
        } as any);
        render(<DocumentList />);
        const doc1 = await screen.findByText("test1.pdf");
        const doc2 = await screen.findByText("test2.pdf");
        expect(doc1).toBeInTheDocument();
        expect(doc2).toBeInTheDocument();
    });
});
