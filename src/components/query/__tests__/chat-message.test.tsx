import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { ChatMessage } from "../chat-message";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
describe("ChatMessage", () => {
    it("should render user message", () => {
        const message: ChatMessageType = {
            id: "msg-1",
            role: "user",
            content: "Hello, how are you?",
            timestamp: new Date("2024-01-01T10:00:00"),
        };
        render(<ChatMessage message={message}/>);
        expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
    });
    it("should render assistant message", () => {
        const message: ChatMessageType = {
            id: "msg-2",
            role: "assistant",
            content: "I'm doing well, thank you!",
            timestamp: new Date("2024-01-01T10:01:00"),
        };
        render(<ChatMessage message={message}/>);
        expect(screen.getByText("I'm doing well, thank you!")).toBeInTheDocument();
    });
    it("should display timestamp", () => {
        const message: ChatMessageType = {
            id: "msg-1",
            role: "user",
            content: "Test message",
            timestamp: new Date("2024-01-01T10:00:00"),
        };
        render(<ChatMessage message={message}/>);
        const timestamp = screen.getByText(/10:00/i);
        expect(timestamp).toBeInTheDocument();
    });
    it("should render sources for assistant messages", async () => {
        const user = userEvent.setup();
        const message: ChatMessageType = {
            id: "msg-2",
            role: "assistant",
            content: "Answer with sources",
            timestamp: new Date("2024-01-01T10:00:00"),
            sources: [
                {
                    content: "Source content 1",
                    similarity: 0.9,
                    metadata: { pageNumber: 1 },
                },
                {
                    content: "Source content 2",
                    similarity: 0.8,
                    metadata: { pageNumber: 2 },
                },
            ],
        };
        render(<ChatMessage message={message}/>);
        const sourcesButton = await screen.findByText(/2 Fontes/i);
        await user.click(sourcesButton);
        await waitFor(() => {
            expect(screen.getByText(/Source content 1/i)).toBeInTheDocument();
            expect(screen.getByText(/Source content 2/i)).toBeInTheDocument();
        });
    });
    it("should not render sources for user messages", () => {
        const message: ChatMessageType = {
            id: "msg-1",
            role: "user",
            content: "User message",
            timestamp: new Date("2024-01-01T10:00:00"),
            sources: [
                {
                    content: "Source content",
                    page: 1,
                    score: 0.9,
                },
            ],
        };
        render(<ChatMessage message={message}/>);
        expect(screen.queryByText("Source content")).not.toBeInTheDocument();
    });
    it("should not render sources when empty", () => {
        const message: ChatMessageType = {
            id: "msg-2",
            role: "assistant",
            content: "Answer without sources",
            timestamp: new Date("2024-01-01T10:00:00"),
        };
        render(<ChatMessage message={message}/>);
        expect(screen.getByText("Answer without sources")).toBeInTheDocument();
    });
});
