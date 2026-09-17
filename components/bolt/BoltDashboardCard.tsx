import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { BoltPromptButton } from "@/components/bolt/BoltPromptButton";

const prompts = ["¿Qué hago hoy?", "¿Cómo voy esta semana?", "¿Estoy recuperado?"];

export function BoltDashboardCard({ hasPlan }: { hasPlan: boolean }) {
  return (
    <section className="area-bolt app-card relative overflow-hidden bg-[linear-gradient(145deg,#111114,#282832)] p-5 text-white sm:p-6">
      <div aria-hidden className="absolute -top-16 -right-14 size-40 rounded-full border-[30px] border-white/[.035]" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-white text-ink"><Zap size={19} fill="currentColor" /></span>
        <span className="rounded-full bg-white/[.07] px-3 py-1 text-[9px] font-bold tracking-[.1em] text-white/60 uppercase">Entrenador inteligente</span>
      </div>
      <div className="relative mt-5">
        <p className="text-[10px] font-bold tracking-[.12em] text-[#8dbdff] uppercase">Bolt AI</p>
        <h2 className="mt-2 text-xl font-bold tracking-[-0.035em]">Entrena con tu contexto real</h2>
        <p className="mt-2 text-xs leading-5 text-white/55">Consulta tu sesión, recuperación y progreso sin perder de vista tu plan.</p>
      </div>
      <div className="relative mt-4 flex flex-wrap gap-2">
        {prompts.map((prompt) => <BoltPromptButton key={prompt} prompt={prompt} contextType="dashboard" className="min-h-9 rounded-xl bg-white/[.08] px-3 text-[10px] font-semibold text-white hover:bg-white/[.13]">{prompt}</BoltPromptButton>)}
      </div>
      {!hasPlan && <Link href="/plan/generate" className="relative mt-4 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold text-ink">Crear plan con Bolt AI <ArrowUpRight size={15} /></Link>}
    </section>
  );
}
