import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { useUploadDocument, useDocuments } from "@/hooks/use-documents";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
vi.mock("@/hooks/use-documents", () => ({
    useUploadDocument: vi.fn(),
    useDocuments: vi.fn(),
    useDeleteDocument: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}));
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: {
        children: React.ReactNode;
    }) => (<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
};
describe("Document Flow Integration", () => {
    const mockMutate = vi.fn();
    const mockDocuments = [
        {
            id: "doc-1",
            filename: "test1.pdf",
            status: "completed" as const,
            fileSize: 1024,
            createdAt: new Date().toISOString(),
        },
    ];
    beforeEach(() => {
        vi.clearAllMocks();
        (useUploadDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as any);
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { documents: mockDocuments },
            isLoading: false,
            error: null,
        } as any);
    });
    it("should upload and list documents", async () => {
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        render(<div>
        <DocumentUploader />
        <DocumentList />
      </div>, { wrapper: createWrapper() });
        const user = userEvent.setup();
        const doc = await screen.findByText("test1.pdf");
        expect(doc).toBeInTheDocument();
        const fileInput = screen.getByLabelText(/selecionar arquivo/i);
        await user.upload(fileInput, file);
        expect(mockMutate).toHaveBeenCalledWith(file);
    });
    it("should show empty state when no documents", () => {
        (useDocuments as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { documents: [] },
            isLoading: false,
            error: null,
        } as any);
        render(<DocumentList />, { wrapper: createWrapper() });
        expect(screen.getByText("Nenhum documento encontrado")).toBeInTheDocument();
    });
    it("should show loading state during upload", () => {
        (useUploadDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutate: mockMutate,
            isPending: true,
        } as any);
        render(<DocumentUploader />);
        expect(screen.getByText("Enviando...")).toBeInTheDocument();
    });
});
