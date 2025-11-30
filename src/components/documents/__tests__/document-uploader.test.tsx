import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { DocumentUploader } from "../document-uploader";
import { useUploadDocument } from "@/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
vi.mock("@/hooks/use-documents");
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(),
}));
describe("DocumentUploader", () => {
    const mockMutate = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useUploadDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as any);
        (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
            auth: {},
        } as any);
    });
    it("should render uploader component", () => {
        render(<DocumentUploader />);
        expect(screen.getByText("Enviar Documento Jurídico")).toBeInTheDocument();
        expect(screen.getByText(/arraste e solte um arquivo PDF/i)).toBeInTheDocument();
        expect(screen.getByText("Selecionar Arquivo")).toBeInTheDocument();
    });
    it("should handle file selection", async () => {
        const user = userEvent.setup();
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        render(<DocumentUploader />);
        const fileInput = screen.getByLabelText(/selecionar arquivo/i);
        await user.upload(fileInput, file);
        expect(mockMutate).toHaveBeenCalledWith(file);
    });
    it("should handle drag and drop", async () => {
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        render(<DocumentUploader />);
        const card = screen.getByText("Enviar Documento Jurídico").closest('[data-slot="card"]') ||
            screen.getByText("Enviar Documento Jurídico").closest('div[class*="border"]');
        expect(card).toBeTruthy();
        if (card) {
            const dataTransfer = {
                files: [file],
                items: [{
                        kind: 'file',
                        type: file.type,
                        getAsFile: () => file,
                    }],
                effectAllowed: 'all',
                dropEffect: 'move',
            } as any;
            const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any;
            dropEvent.dataTransfer = dataTransfer;
            card.dispatchEvent(dropEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(mockMutate).toHaveBeenCalledWith(file);
        }
    });
    it("should show loading state during upload", () => {
        (useUploadDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutate: mockMutate,
            isPending: true,
        } as any);
        render(<DocumentUploader />);
        expect(screen.getByText("Enviando...")).toBeInTheDocument();
    });
    it("should disable input during upload", () => {
        (useUploadDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutate: mockMutate,
            isPending: true,
        } as any);
        render(<DocumentUploader />);
        expect(screen.getByText("Enviando...")).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeTruthy();
        expect(fileInput.disabled).toBe(true);
    });
});
