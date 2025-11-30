"use client";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/types/chat";
export function useChatHistory(documentId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    useEffect(() => {
        const stored = localStorage.getItem(`chat-${documentId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setMessages(parsed.map((msg: ChatMessage) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                })));
            }
            catch (error) {
                console.error("Failed to parse chat history:", error);
            }
        }
    }, [documentId]);
    const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
        const newMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        };
        setMessages((prev) => {
            const updated = [...prev, newMessage];
            localStorage.setItem(`chat-${documentId}`, JSON.stringify(updated));
            return updated;
        });
        return newMessage;
    };
    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem(`chat-${documentId}`);
    };
    return { messages, addMessage, clearHistory };
}
