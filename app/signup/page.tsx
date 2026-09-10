import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { SignupForm } from "@/components/auth/SignupForm";
import { getAuthenticatedUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage() {
  const configured = isSupabaseConfigured();

  if (configured && (await getAuthenticatedUser())) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-8 sm:py-12">
      <div aria-hidden className="absolute -top-40 -right-28 size-[440px] rounded-full border-[80px] border-accent/5" />
      <div aria-hidden className="absolute -bottom-32 -left-28 size-80 rounded-full border-[55px] border-ink/[0.025]" />

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="grid size-11 place-items-center rounded-[15px] bg-ink text-white shadow-sm">
            <span className="h-4 w-4 rotate-45 rounded-[5px] border-[3px] border-white" />
          </span>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Marathon</span>
            <span className="block text-lg font-bold tracking-[-0.025em]">Dashboard</span>
          </div>
        </div>

        <section className="app-card p-5 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Sparkles size={22} /></span>
          <h1 className="mt-6 text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">Crea tu preparación</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Cuéntanos sobre ti y tu siguiente objetivo. Solo tendrás que hacerlo una vez.</p>
          <SignupForm configured={configured} />
        </section>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck size={14} /> Perfil privado y sesión protegida con Supabase
        </p>
      </div>
    </main>
  );
}
