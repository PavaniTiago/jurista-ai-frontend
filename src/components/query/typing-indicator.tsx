import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface TypingIndicatorProps {
  message?: string;
}

export function TypingIndicator({
  message = "Consultando jurisprudência...",
}: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 justify-start">
      <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4 md:h-5 md:w-5" />
        </AvatarFallback>
      </Avatar>

      <Card className="bg-muted max-w-[85%] md:max-w-[80%] rounded-2xl border-2">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm md:text-base text-muted-foreground">
              {message}
            </span>
            <div className="flex gap-1 shrink-0">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
