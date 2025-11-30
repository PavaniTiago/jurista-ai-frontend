import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "../chat-input";
describe("ChatInput", () => {
    it("should render chat input", () => {
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        expect(screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i)).toBeInTheDocument();
        const submitButton = screen.getByRole("button", { name: "" });
        expect(submitButton).toBeInTheDocument();
    });
    it("should call onSubmit when form is submitted", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        await user.type(textarea, "What is this document about?");
        const submitButton = screen.getByRole("button");
        await user.click(submitButton);
        expect(onSubmit).toHaveBeenCalledWith("What is this document about?");
    });
    it("should clear input after submission", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i) as HTMLTextAreaElement;
        await user.type(textarea, "Test message");
        const submitButton = screen.getByRole("button");
        await user.click(submitButton);
        await waitFor(() => {
            expect(textarea.value).toBe("");
        });
    });
    it("should not submit empty message", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const submitButton = screen.getByRole("button");
        await user.click(submitButton);
        expect(onSubmit).not.toHaveBeenCalled();
    });
    it("should not submit when disabled", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit} disabled/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        await user.type(textarea, "Test message");
        const submitButton = screen.getByRole("button");
        expect(submitButton).toBeDisabled();
        await user.click(submitButton);
        expect(onSubmit).not.toHaveBeenCalled();
    });
    it("should submit on Enter key press", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        await user.type(textarea, "Test message{Enter}");
        expect(onSubmit).toHaveBeenCalledWith("Test message");
    });
    it("should not submit on Shift+Enter", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        await user.type(textarea, "Test message{Shift>}{Enter}{/Shift}");
        expect(onSubmit).not.toHaveBeenCalled();
    });
    it("should use custom placeholder", () => {
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit} placeholder="Custom placeholder"/>);
        expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
    });
    it("should disable button when input is empty", () => {
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const submitButton = screen.getByRole("button");
        expect(submitButton).toBeDisabled();
    });
    it("should enable button when input has text", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<ChatInput onSubmit={onSubmit}/>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        const submitButton = screen.getByRole("button");
        expect(submitButton).toBeDisabled();
        await user.type(textarea, "Test");
        expect(submitButton).not.toBeDisabled();
    });
});
