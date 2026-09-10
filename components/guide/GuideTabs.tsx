"use client";

import { useState } from "react";
import { Activity, BookOpenText, Dumbbell } from "lucide-react";
import { EffortTypeBadge } from "@/components/training/EffortTypeBadge";
import {
  gymGuideEntries,
  gymRules,
  paceGuideEntries,
  practicalGuideEntries,
} from "@/lib/guide/data";

type GuideTab = "paces" | "gym" | "rules";

const tabs = [
  { id: "paces", label: "Ritmos y esfuerzo", icon: Activity },
  { id: "gym", label: "Gimnasio", icon: Dumbbell },
  { id: "rules", label: "Reglas prácticas", icon: BookOpenText },
] as const;

export function GuideTabs() {
  const [activeTab, setActiveTab] = useState<GuideTab>("paces");

  return (
    <div>
      <div role="tablist" aria-label="Secciones de la guía" className="mb-5 grid grid-cols-3 gap-1 rounded-[20px] border border-line bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`guide-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`guide-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => moveTabFocus(event, tab.id)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-2 text-[10px] font-bold transition-all sm:text-xs ${active ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-surface-subtle hover:text-ink"}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.id === "paces" ? "Ritmos" : tab.label}</span>
            </button>
          );
        })}
      </div>

      <div key={activeTab} id={`guide-panel-${activeTab}`} role="tabpanel" aria-labelledby={`guide-tab-${activeTab}`} className="guide-tab-enter">
        {activeTab === "paces" && <PacesPanel />}
        {activeTab === "gym" && <GymPanel />}
        {activeTab === "rules" && <RulesPanel />}
      </div>
    </div>
  );
}

function moveTabFocus(event: React.KeyboardEvent<HTMLButtonElement>, current: GuideTab) {
  const currentIndex = tabs.findIndex((tab) => tab.id === current);
  let nextIndex: number | null = null;

  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  if (nextIndex === null) return;

  event.preventDefault();
  const nextTab = tabs[nextIndex].id;
  const target = document.getElementById(`guide-tab-${nextTab}`);
  setTimeout(() => target?.focus(), 0);
  target?.click();
}

function PacesPanel() {
  return (
    <section aria-labelledby="paces-title">
      <SectionIntro id="paces-title" eyebrow="Referencia rápida" title="Guía de ritmos y esfuerzo" description="El pace orienta; la respiración, la conversación y el RPE confirman si estás haciendo la sesión correcta." />

      <div className="space-y-3 md:hidden">
        {paceGuideEntries.map((entry) => (
          <article key={entry.id} className="app-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold">{entry.type}</h3>
              {entry.effortType && <EffortTypeBadge effortType={entry.effortType} />}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Pace" value={entry.pace} />
              <Metric label="RPE" value={entry.rpe} />
              <Metric label="Sensación" value={entry.sensation} />
              <Metric label="Para qué" value={entry.purpose} />
            </div>
            <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-xs leading-5 text-accent-dark">{entry.practicalRule}</p>
          </article>
        ))}
      </div>

      <div className="app-card hidden overflow-hidden md:block">
        <div className="grid grid-cols-[1.1fr_1fr_.55fr_1.15fr_1fr_1.6fr] gap-4 border-b border-line bg-surface-subtle px-5 py-3 text-[10px] font-bold tracking-wide text-muted uppercase">
          <span>Tipo</span><span>Pace aprox.</span><span>RPE</span><span>Sensación</span><span>Para qué</span><span>Regla práctica</span>
        </div>
        {paceGuideEntries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[1.1fr_1fr_.55fr_1.15fr_1fr_1.6fr] items-center gap-4 border-b border-line/80 px-5 py-4 text-xs last:border-0">
            <div className="space-y-2"><span className="block font-bold">{entry.type}</span>{entry.effortType && <EffortTypeBadge effortType={entry.effortType} />}</div>
            <span className="font-semibold">{entry.pace}</span>
            <span className="font-bold text-accent">{entry.rpe}</span>
            <span>{entry.sensation}</span>
            <span>{entry.purpose}</span>
            <span className="leading-5 text-muted">{entry.practicalRule}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GymPanel() {
  return (
    <section aria-labelledby="gym-title">
      <SectionIntro id="gym-title" eyebrow="Fuerza para correr" title="Rutinas de gimnasio" description="Tres fichas derivadas del plan original. Prioriza técnica, reserva y llegar con buenas piernas a la siguiente carrera." />
      <div className="grid gap-4 xl:grid-cols-3">
        {gymGuideEntries.map((routine) => (
          <article key={routine.id} className="app-card overflow-hidden">
            <div className="border-b border-line bg-ink p-5 text-white">
              <p className="text-[10px] font-bold tracking-[0.12em] text-white/50 uppercase">Ficha de fuerza</p>
              <h3 className="mt-2 text-xl font-bold">{routine.name}</h3>
              <p className="mt-2 text-xs leading-5 text-white/65">{routine.description}</p>
            </div>
            <div className="divide-y divide-line px-4">
              {routine.exercises.map((exercise) => (
                <div key={exercise.exercise} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-bold">{exercise.exercise}</h4>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent-dark">{exercise.sets} × {exercise.reps}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-muted">
                    <span>RIR {exercise.rir}</span><span>Descanso {exercise.rest}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-muted">{exercise.notes}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gymRules.map((rule, index) => (
          <TopicCard
            key={rule.id}
            number={String(index + 1).padStart(2, "0")}
            title={rule.topic}
            description={rule.description}
          />
        ))}
      </div>
    </section>
  );
}

function RulesPanel() {
  return (
    <section aria-labelledby="rules-title">
      <SectionIntro id="rules-title" eyebrow="Entrenar con criterio" title="Reglas prácticas" description="Ideas simples para interpretar el plan cuando el clima, la fatiga o las sensaciones no coinciden con el papel." />
      <div className="grid gap-3 sm:grid-cols-2">
        {practicalGuideEntries.map((entry, index) => (
          <TopicCard key={entry.id} number={String(index + 1).padStart(2, "0")} title={entry.topic} description={entry.description} featured={index === practicalGuideEntries.length - 1} />
        ))}
      </div>
      <div className="mt-5 rounded-[26px] bg-ink p-5 text-white sm:p-6">
        <p className="eyebrow !text-white/45">Principio central</p>
        <p className="mt-3 max-w-3xl text-lg font-bold leading-7 sm:text-xl">El objetivo del plan no es ganar cada entrenamiento. Es acumular semanas consistentes y llegar sano al evento.</p>
      </div>
    </section>
  );
}

function SectionIntro({ id, eyebrow, title, description }: { id: string; eyebrow: string; title: string; description: string }) {
  return <div className="mb-5"><p className="eyebrow">{eyebrow}</p><h2 id={id} className="mt-3 text-2xl font-bold tracking-[-0.035em]">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-surface-subtle p-3"><span className="block text-[9px] font-bold tracking-wide text-muted uppercase">{label}</span><span className="mt-1 block text-xs font-bold">{value}</span></div>;
}

function TopicCard({ number, title, description, featured = false }: { number: string; title: string; description: string; featured?: boolean }) {
  return (
    <article className={`min-w-0 overflow-hidden rounded-[22px] border p-4 sm:p-5 ${featured ? "border-accent/20 bg-accent-soft" : "border-line bg-white"}`}>
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-subtle text-[10px] font-bold tracking-wide text-muted">
          {number}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="break-words text-sm font-bold leading-5">{title}</h3>
          <p className="mt-1.5 break-words text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
    </article>
  );
}
