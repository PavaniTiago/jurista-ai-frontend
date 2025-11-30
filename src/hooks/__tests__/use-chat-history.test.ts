import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatHistory } from "../use-chat-history";
import type { ChatMessage } from "@/types/chat";
describe("useChatHistory", () => {
    const documentId = "test-doc-123";
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });
    it("should initialize with empty messages", () => {
        const { result } = renderHook(() => useChatHistory(documentId));
        expect(result.current.messages).toEqual([]);
    });
    it("should load messages from localStorage on mount", () => {
        const storedMessages: ChatMessage[] = [
            {
                id: "msg-1",
                role: "user",
                content: "Hello",
                timestamp: new Date("2024-01-01"),
            },
            {
                id: "msg-2",
                role: "assistant",
                content: "Hi there!",
                timestamp: new Date("2024-01-02"),
            },
        ];
        localStorage.setItem(`chat-${documentId}`, JSON.stringify(storedMessages));
        const { result } = renderHook(() => useChatHistory(documentId));
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[0].content).toBe("Hello");
        expect(result.current.messages[1].content).toBe("Hi there!");
    });
    it("should add a new message", () => {
        const { result } = renderHook(() => useChatHistory(documentId));
        act(() => {
            result.current.addMessage({
                role: "user",
                content: "Test message",
            });
        });
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe("Test message");
        expect(result.current.messages[0].role).toBe("user");
        expect(result.current.messages[0].id).toBeDefined();
        expect(result.current.messages[0].timestamp).toBeInstanceOf(Date);
    });
    it("should save messages to localStorage when adding", () => {
        const { result } = renderHook(() => useChatHistory(documentId));
        act(() => {
            result.current.addMessage({
                role: "user",
                content: "Test message",
            });
        });
        const stored = localStorage.getItem(`chat-${documentId}`);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].content).toBe("Test message");
    });
    it("should clear all messages", () => {
        const { result } = renderHook(() => useChatHistory(documentId));
        act(() => {
            result.current.addMessage({
                role: "user",
                content: "Test message",
            });
        });
        expect(result.current.messages).toHaveLength(1);
        act(() => {
            result.current.clearHistory();
        });
        expect(result.current.messages).toEqual([]);
        expect(localStorage.getItem(`chat-${documentId}`)).toBeNull();
    });
    it("should handle different document IDs separately", () => {
        const { result: result1 } = renderHook(() => useChatHistory("doc-1"));
        const { result: result2 } = renderHook(() => useChatHistory("doc-2"));
        act(() => {
            result1.current.addMessage({
                role: "user",
                content: "Message for doc 1",
            });
        });
        act(() => {
            result2.current.addMessage({
                role: "user",
                content: "Message for doc 2",
            });
        });
        expect(result1.current.messages).toHaveLength(1);
        expect(result2.current.messages).toHaveLength(1);
        expect(result1.current.messages[0].content).toBe("Message for doc 1");
        expect(result2.current.messages[0].content).toBe("Message for doc 2");
    });
    it("should handle invalid JSON in localStorage gracefully", () => {
        localStorage.setItem(`chat-${documentId}`, "invalid-json");
        const { result } = renderHook(() => useChatHistory(documentId));
        expect(result.current.messages).toEqual([]);
    });
});
