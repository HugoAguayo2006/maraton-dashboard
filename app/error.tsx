"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <section className="app-card max-w-md p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger"><TriangleAlert size={21} /></span>
        <h1 className="mt-5 text-xl font-bold tracking-[-0.03em]">Algo no salió como esperábamos</h1>
        <p className="mt-2 text-sm leading-6 text-muted">No pudimos cargar esta sección. Tus datos siguen seguros; intenta nuevamente.</p>
        <button type="button" onClick={reset} className="pressable mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white">
          <RefreshCw size={16} /> Reintentar
        </button>
      </section>
    </main>
  );
}
