import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { SourceViewer } from "./source-viewer";
interface ChatMessageProps {
    message: ChatMessageType;
}
export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";
    return (<div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (<Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4 md:h-5 md:w-5"/>
          </AvatarFallback>
        </Avatar>)}

      <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[80%] overflow-visible`}>
        <Card className={`rounded-2xl shadow-sm overflow-visible ${isUser ? "bg-primary text-primary-foreground" : "bg-muted border-2"}`}>
          <CardContent className="p-3 md:p-4">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </CardContent>
        </Card>

        {!isUser && message.sources && message.sources.length > 0 && (<SourceViewer sources={message.sources}/>)}

        <span className="text-xs md:text-sm text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        })}
        </span>
      </div>

      {isUser && (<Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4 md:h-5 md:w-5"/>
          </AvatarFallback>
        </Avatar>)}
    </div>);
}
