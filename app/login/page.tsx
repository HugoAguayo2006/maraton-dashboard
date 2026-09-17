import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppLogo } from "@/components/branding/AppLogo";
import { getAuthenticatedUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmation?: string }>;
}) {
  const configured = isSupabaseConfigured();
  const { next, confirmation } = await searchParams;

  if (configured && (await getAuthenticatedUser())) redirect("/dashboard");

  return (
    <main className="relative grid min-h-screen min-h-dvh place-items-center overflow-x-hidden bg-canvas px-4 py-8 sm:py-10">
      <div aria-hidden className="absolute -top-40 -right-28 size-[440px] rounded-full border-[80px] border-accent/5" />
      <div aria-hidden className="absolute -bottom-32 -left-28 size-80 rounded-full border-[55px] border-ink/[0.025]" />

      <div className="relative w-full max-w-[560px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <AppLogo priority />
          <div>
            <span className="block text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Run</span>
            <span className="block text-lg font-bold tracking-[-0.025em]">Dashboard</span>
          </div>
        </div>

        <section className="app-card p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Activity size={22} /></span>
          <h1 className="mt-6 text-[2rem] leading-none font-bold tracking-[-0.045em]">Bienvenido</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Tu preparación para Guadalajara, en un solo lugar.</p>
          {confirmation === "invalid" && (
            <p className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-semibold leading-5 text-danger">
              El enlace de confirmación no es válido o ya expiró. Solicita uno nuevo e intenta otra vez.
            </p>
          )}
          <LoginForm configured={configured} nextPath={next} />
        </section>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck size={14} /> Sesión protegida con Supabase Auth
        </p>
      </div>
    </main>
  );
}
