"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { Header } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <main className="container px-4 py-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Meus Documentos
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Gerencie e consulte seus documentos jurídicos
            </p>
          </div>

          <DocumentUploader />

          <Separator className="my-8" />

          <DocumentList />
        </div>
      </main>
    </div>
  );
}
