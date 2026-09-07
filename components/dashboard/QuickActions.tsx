import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Plus,
  Sparkles,
} from "lucide-react";

const actions = [
  { label: "Registrar entrenamiento", href: "/workouts/new", icon: Plus },
  { label: "Ver plan", href: "/plan", icon: CalendarDays },
  { label: "Ver progreso", href: "/progress", icon: ChartNoAxesCombined },
];

export function QuickActions() {
  return (
    <section className="area-actions card-enter space-y-3">
      <div className="app-card p-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors hover:bg-surface-subtle"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon size={16} />
              </span>
              {action.label}
              <ArrowUpRight size={15} className="ml-auto text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
      <div className="rounded-[24px] border border-dashed border-line bg-white/45 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-2xl bg-white text-muted shadow-sm">
            <Sparkles size={17} />
          </span>
          <div>
            <p className="text-xs font-bold">Asistente de entrenamiento</p>
            <p className="mt-0.5 text-[11px] text-muted">Analiza tu semana</p>
          </div>
          <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[9px] font-bold tracking-wide text-muted uppercase shadow-sm">
            Próximamente
          </span>
        </div>
      </div>
    </section>
  );
}
