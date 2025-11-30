"use client";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { ChatInput } from "@/components/query/chat-input";
import { ChatMessage } from "@/components/query/chat-message";
import { TypingIndicator } from "@/components/query/typing-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useDocumentQuery } from "@/hooks/use-document-query";
import { useDocument } from "@/hooks/use-documents";
export default function DocumentChatPage() {
    const params = useParams();
    const documentId = params.id as string;
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { data: documentData, isLoading: documentLoading } = useDocument(documentId);
    const { query, loading: queryLoading } = useDocumentQuery(documentId);
    const { messages, addMessage, clearHistory } = useChatHistory(documentId);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, queryLoading]);
    const handleSendMessage = async (message: string) => {
        addMessage({
            role: "user",
            content: message,
        });
        const response = await query(message);
        if (response) {
            addMessage({
                role: "assistant",
                content: response.answer,
                sources: response.sources,
            });
        }
        else {
            addMessage({
                role: "assistant",
                content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
            });
        }
    };
    if (authLoading || documentLoading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>);
    }
    if (!user || !documentData) {
        return null;
    }
    const document = documentData.document;
    const statusConfig = {
        pending: { label: "Pendente", variant: "secondary" as const },
        processing: { label: "Processando", variant: "default" as const },
        completed: { label: "Concluído", variant: "default" as const },
        failed: { label: "Falhou", variant: "destructive" as const },
    };
    const status = statusConfig[document.status];
    return (<div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header />

      <main className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          
          <aside className="space-y-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2"/>
              Voltar
            </Button>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0"/>
                  <span className="flex-1 break-words">
                    {document.filename}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-visible">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tamanho</p>
                  <p className="text-sm">
                    {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Separator />
                <Button variant="outline" size="sm" onClick={clearHistory} className="w-full text-destructive rounded-xl hover:bg-destructive/10" disabled={messages.length === 0}>
                  <Trash2 className="h-4 w-4 mr-2"/>
                  Limpar Histórico
                </Button>
              </CardContent>
            </Card>
          </aside>

          
          <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)]">
            <Card className="flex-1 flex flex-col rounded-2xl border-2 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 shrink-0">
                <CardTitle className="text-xl md:text-2xl">
                  Consulta ao Documento
                </CardTitle>
                <p className="text-sm md:text-base text-muted-foreground">
                  Faça perguntas sobre o conteúdo do documento. As respostas
                  serão baseadas nas informações extraídas.
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden">
                <ScrollArea className="flex-1 min-h-0 pr-2 md:pr-4">
                  <div className="space-y-4 md:space-y-6 pb-4">
                    {messages.length === 0 && (<div className="text-center py-12 md:py-16 text-muted-foreground">
                        <div className="rounded-2xl bg-primary/10 p-6 w-fit mx-auto mb-6">
                          <FileText className="h-12 w-12 md:h-16 md:w-16 text-primary"/>
                        </div>
                        <p className="text-base md:text-lg font-semibold mb-2">
                          Nenhuma mensagem ainda
                        </p>
                        <p className="text-sm md:text-base">
                          Comece fazendo uma pergunta sobre o documento
                        </p>
                      </div>)}

                    {messages.map((message) => (<ChatMessage key={message.id} message={message}/>))}

                    {queryLoading && (<TypingIndicator message="Consultando jurisprudência..."/>)}

                    <div ref={scrollRef}/>
                  </div>
                </ScrollArea>

                <div className="shrink-0 pt-4 space-y-4">
                  <Separator />
                  <ChatInput onSubmit={handleSendMessage} disabled={queryLoading || document.status !== "completed"} placeholder={document.status === "completed"
            ? "Faça uma pergunta sobre o documento..."
            : "Aguardando processamento do documento..."}/>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>);
}
