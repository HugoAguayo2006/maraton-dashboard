import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getAthleteProfile } from "@/lib/data/athlete";
import { isAthleteProfileComplete } from "@/lib/profile/profile";

export const metadata: Metadata = { title: "Completa tu perfil" };

export default async function OnboardingPage() {
  const profile = await getAthleteProfile();
  if (isAthleteProfileComplete(profile)) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-8 sm:grid sm:place-items-center sm:py-12">
      <div aria-hidden className="absolute -top-40 -right-28 size-[440px] rounded-full border-[80px] border-accent/5" />
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[15px] bg-ink text-white shadow-sm">
            <Activity size={21} />
          </span>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Marathon</span>
            <span className="block text-lg font-bold tracking-[-0.025em]">Tu punto de partida</span>
          </div>
        </div>

        <section className="app-card p-5 sm:p-8">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><Sparkles size={20} /></span>
          <h1 className="mt-5 text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.5rem]">Cuéntanos sobre ti</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Usaremos estos datos para personalizar tu preparación. Tu edad se calculará automáticamente.</p>
          <div className="mt-7"><ProfileForm profile={profile} intent="onboarding" /></div>
        </section>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck size={14} /> Datos privados protegidos con Row Level Security
        </p>
      </div>
    </main>
  );
}
