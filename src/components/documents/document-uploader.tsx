"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUploadDocument } from "@/hooks/use-documents";

export function DocumentUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const uploadDocument = useUploadDocument();

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        return;
      }

      uploadDocument.mutate(file);
    },
    [uploadDocument],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-300 rounded-2xl ${
        isDragging
          ? "border-primary bg-primary/10 shadow-lg scale-[1.02]"
          : "border-muted-foreground/25 hover:border-muted-foreground/40"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
        <div className="rounded-2xl bg-primary/10 p-4 mb-6">
          <Upload className="h-10 w-10 md:h-12 md:w-12 text-primary" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold mb-2">
          Enviar Documento Jurídico
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md">
          Arraste e solte um arquivo PDF ou clique para selecionar
        </p>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={uploadDocument.isPending}
        />
        <Button
          asChild
          disabled={uploadDocument.isPending}
          size="lg"
          className="rounded-xl"
        >
          <label htmlFor="file-upload" className="cursor-pointer">
            {uploadDocument.isPending ? "Enviando..." : "Selecionar Arquivo"}
          </label>
        </Button>
        <p className="text-xs md:text-sm text-muted-foreground mt-4">
          Apenas arquivos PDF são suportados
        </p>
      </CardContent>
    </Card>
  );
}
