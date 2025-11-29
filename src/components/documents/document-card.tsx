"use client";

import { FileText, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteDocument } from "@/hooks/use-documents";
import type { Document } from "@/types/document";

interface DocumentCardProps {
  document: Document;
}

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const },
  processing: { label: "Processando", variant: "default" as const },
  completed: { label: "Concluído", variant: "default" as const },
  failed: { label: "Falhou", variant: "destructive" as const },
};

export function DocumentCard({ document }: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const deleteDocument = useDeleteDocument();

  const handleDelete = async () => {
    await deleteDocument.mutateAsync(document.id);
    setShowDeleteDialog(false);
  };

  const handleOpenChat = () => {
    if (document.status === "completed") {
      router.push(`/documents/${document.id}`);
    }
  };

  const status = statusConfig[document.status];
  const fileSize = (document.fileSize / 1024 / 1024).toFixed(2);

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-2xl border-2">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="rounded-xl bg-primary/10 p-2 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base truncate">
                {document.filename}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {fileSize} MB
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 rounded-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                onClick={handleOpenChat}
                disabled={document.status !== "completed"}
                className="rounded-lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Abrir Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive rounded-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pb-3">
          <Badge variant={status.variant} className="rounded-lg">
            {status.label}
          </Badge>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            onClick={handleOpenChat}
            disabled={document.status !== "completed"}
            className="w-full rounded-xl"
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {document.status === "completed"
              ? "Consultar Documento"
              : "Aguardando processamento"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir Documento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{document.filename}"? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDocument.isPending}
              className="rounded-xl"
            >
              {deleteDocument.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
