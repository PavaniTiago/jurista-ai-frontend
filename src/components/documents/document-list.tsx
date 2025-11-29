"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentCard } from "./document-card";

export function DocumentList() {
  const { data, isLoading, error } = useDocuments();

  if (isLoading) {
    const skeletonKeys = Array.from({ length: 6 }, (_, i) => `skeleton-${Math.random()}-${i}`);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletonKeys.map((key) => (
          <Skeleton key={key} className="h-48" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar documentos</p>
      </div>
    );
  }

  if (!data?.documents.length) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          Nenhum documento encontrado
        </h3>
        <p className="text-muted-foreground">
          Comece enviando seu primeiro documento jurídico
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
