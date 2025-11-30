import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "@/components/query/chat-input";
import { ChatMessage } from "@/components/query/chat-message";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
describe("Chat Flow Integration", () => {
    it("should send message and display it", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const messages: ChatMessageType[] = [];
        const { rerender } = render(<div>
        <ChatInput onSubmit={onSubmit}/>
        {messages.map((msg) => (<ChatMessage key={msg.id} message={msg}/>))}
      </div>);
        const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o documento/i);
        await user.type(textarea, "What is this document about?");
        const submitButton = screen.getByRole("button");
        await user.click(submitButton);
        expect(onSubmit).toHaveBeenCalledWith("What is this document about?");
        const newMessage: ChatMessageType = {
            id: "msg-1",
            role: "user",
            content: "What is this document about?",
            timestamp: new Date(),
        };
        messages.push(newMessage);
        rerender(<div>
        <ChatInput onSubmit={onSubmit}/>
        {messages.map((msg) => (<ChatMessage key={msg.id} message={msg}/>))}
      </div>);
        expect(screen.getByText("What is this document about?")).toBeInTheDocument();
    });
    it("should display user and assistant messages", async () => {
        const user = userEvent.setup();
        const messages: ChatMessageType[] = [
            {
                id: "msg-1",
                role: "user",
                content: "What is this?",
                timestamp: new Date("2024-01-01T10:00:00"),
            },
            {
                id: "msg-2",
                role: "assistant",
                content: "This is a legal document.",
                timestamp: new Date("2024-01-01T10:01:00"),
                sources: [
                    {
                        content: "Source content",
                        similarity: 0.9,
                        metadata: { pageNumber: 1 },
                    },
                ],
            },
        ];
        render(<div>
        {messages.map((msg) => (<ChatMessage key={msg.id} message={msg}/>))}
      </div>);
        expect(await screen.findByText("What is this?")).toBeInTheDocument();
        expect(await screen.findByText("This is a legal document.")).toBeInTheDocument();
        const sourcesButton = await screen.findByText(/1 Fonte/i);
        await user.click(sourcesButton);
        await waitFor(() => {
            expect(screen.getByText(/Source content/i)).toBeInTheDocument();
        });
    });
});
