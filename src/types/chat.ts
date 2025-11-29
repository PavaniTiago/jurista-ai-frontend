import type { SourceChunk } from "./query";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: SourceChunk[];
  timestamp: Date;
}

export interface ConversationHistory {
  documentId: string;
  messages: ChatMessage[];
}
