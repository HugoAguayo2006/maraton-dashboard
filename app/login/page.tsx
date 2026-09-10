import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthenticatedUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const configured = isSupabaseConfigured();

  if (configured && (await getAuthenticatedUser())) redirect("/dashboard");

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10">
      <div aria-hidden className="absolute -top-40 -right-28 size-[440px] rounded-full border-[80px] border-accent/5" />
      <div aria-hidden className="absolute -bottom-32 -left-28 size-80 rounded-full border-[55px] border-ink/[0.025]" />

      <div className="relative w-full max-w-[560px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="grid size-11 place-items-center rounded-[15px] bg-ink text-white shadow-sm">
            <span className="h-4 w-4 rotate-45 rounded-[5px] border-[3px] border-white" />
          </span>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Marathon</span>
            <span className="block text-lg font-bold tracking-[-0.025em]">Dashboard</span>
          </div>
        </div>

        <section className="app-card p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Activity size={22} /></span>
          <h1 className="mt-6 text-[2rem] leading-none font-bold tracking-[-0.045em]">Bienvenido</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Tu preparación para Guadalajara, en un solo lugar.</p>
          <LoginForm configured={configured} />
        </section>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck size={14} /> Sesión protegida con Supabase Auth
        </p>
      </div>
    </main>
  );
}
