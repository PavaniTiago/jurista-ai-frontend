import { useState } from "react";
import { api } from "@/lib/api-client";
import type { SourceChunk } from "@/types/query";

export function useDocumentQuery(documentId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceChunk[]>([]);

  const query = async (question: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.queryDocument(documentId, question);
      setAnswer(result.answer);
      setSources(result.sources);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao consultar documento";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnswer(null);
    setSources([]);
    setError(null);
  };

  return { query, loading, error, answer, sources, reset };
}
