import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  BookOpenText,
  ChartNoAxesCombined,
  Dumbbell,
  Plus,
} from "lucide-react";

const actions = [
  { label: "Registrar entrenamiento", href: "/workouts/new", icon: Plus },
  { label: "Registrar fuerza", href: "/strength/session/new", icon: Dumbbell },
  { label: "Ver plan", href: "/plan", icon: CalendarDays },
  { label: "Ver progreso", href: "/progress", icon: ChartNoAxesCombined },
  { label: "Consultar guía", href: "/guide", icon: BookOpenText },
];

export function QuickActions() {
  return (
    <section className="area-actions card-enter">
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
    </section>
  );
}
