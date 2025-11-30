import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { DocumentCard } from "../document-card";
import { useDeleteDocument } from "@/hooks/use-documents";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/document";
vi.mock("@/hooks/use-documents", () => ({
    useDeleteDocument: vi.fn(),
}));
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(),
}));
describe("DocumentCard", () => {
    const mockDocument: Document = {
        id: "doc-1",
        filename: "test-document.pdf",
        status: "completed",
        fileSize: 1024 * 1024,
        createdAt: new Date().toISOString(),
    };
    const mockPush = vi.fn();
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
            replace: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: vi.fn(),
        } as any);
        (useDeleteDocument as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        } as any);
        (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
            auth: {},
        } as any);
    });
    it("should render document information", () => {
        render(<DocumentCard document={mockDocument}/>);
        expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
        expect(screen.getByText("1.00 MB")).toBeInTheDocument();
        expect(screen.getByText("Concluído")).toBeInTheDocument();
    });
    it("should show correct status badge", () => {
        const pendingDoc = { ...mockDocument, status: "pending" as const };
        render(<DocumentCard document={pendingDoc}/>);
        expect(screen.getByText("Pendente")).toBeInTheDocument();
    });
    it("should navigate to document chat when chat button is clicked", async () => {
        const user = userEvent.setup();
        render(<DocumentCard document={mockDocument}/>);
        const menuButtons = screen.getAllByRole("button");
        const menuButton = menuButtons.find(btn => btn.querySelector('svg'));
        expect(menuButton).toBeTruthy();
        if (menuButton) {
            await user.click(menuButton);
            const chatButton = await screen.findByText("Abrir Chat");
            await user.click(chatButton);
            expect(mockPush).toHaveBeenCalledWith("/documents/doc-1");
        }
    });
    it("should not navigate if document is not completed", async () => {
        const user = userEvent.setup();
        const pendingDoc = { ...mockDocument, status: "pending" as const };
        render(<DocumentCard document={pendingDoc}/>);
        const menuButtons = screen.getAllByRole("button");
        const menuButton = menuButtons.find(btn => btn.querySelector('svg'));
        expect(menuButton).toBeTruthy();
        if (menuButton) {
            await user.click(menuButton);
            const chatButton = await screen.findByText("Abrir Chat");
            const menuItem = chatButton.closest('[role="menuitem"]');
            expect(menuItem).toBeTruthy();
            expect(menuItem?.hasAttribute("disabled") || menuItem?.getAttribute("aria-disabled") === "true").toBe(true);
        }
    });
    it("should open delete dialog when delete is clicked", async () => {
        const user = userEvent.setup();
        render(<DocumentCard document={mockDocument}/>);
        const menuButtons = screen.getAllByRole("button");
        const menuButton = menuButtons.find(btn => btn.querySelector('svg'));
        expect(menuButton).toBeTruthy();
        if (menuButton) {
            await user.click(menuButton);
            const deleteButton = await screen.findByText("Excluir");
            await user.click(deleteButton);
            expect(await screen.findByText(/excluir documento/i)).toBeInTheDocument();
        }
    });
    it("should delete document when confirmed", async () => {
        const user = userEvent.setup();
        render(<DocumentCard document={mockDocument}/>);
        const menuButtons = screen.getAllByRole("button");
        const menuButton = menuButtons.find(btn => btn.querySelector('svg'));
        expect(menuButton).toBeTruthy();
        if (menuButton) {
            await user.click(menuButton);
            const deleteButton = await screen.findByText("Excluir");
            await user.click(deleteButton);
            const confirmButton = await screen.findByRole("button", { name: /^excluir$/i });
            await user.click(confirmButton);
            expect(mockMutateAsync).toHaveBeenCalledWith("doc-1");
        }
    });
});
