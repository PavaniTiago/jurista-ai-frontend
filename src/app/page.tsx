"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/dashboard");
            }
            else {
                router.push("/signup");
            }
        }
    }, [user, loading, router]);
    return (<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <p className="text-muted-foreground">Carregando...</p>
    </div>);
}
