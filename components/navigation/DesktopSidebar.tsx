"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleUserRound,
  Gauge,
  Settings,
  TimerReset,
} from "lucide-react";
import { dashboardData } from "@/data/mockDashboard";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Plan", href: "/plan", icon: CalendarDays },
  { label: "Entrenamientos", href: "/workouts", icon: TimerReset },
  { label: "Progreso", href: "/progress", icon: ChartNoAxesCombined },
  { label: "Configuración", href: "/settings", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line/80 bg-white/85 px-5 py-7 backdrop-blur-xl lg:flex lg:flex-col">
      <Link
        href="/dashboard"
        className="mb-10 flex items-center gap-3 rounded-2xl px-2 focus-visible:rounded-2xl"
        aria-label="Ir al dashboard"
      >
        <span className="grid size-10 place-items-center rounded-[14px] bg-ink text-white shadow-sm">
          <span className="h-4 w-4 rotate-45 rounded-[5px] border-[3px] border-white" />
        </span>
        <span>
          <span className="block text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
            Marathon
          </span>
          <span className="block text-[17px] font-bold tracking-[-0.02em]">
            Dashboard
          </span>
        </span>
      </Link>

      <nav aria-label="Navegación principal" className="space-y-1.5">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-accent-soft text-accent-dark"
                  : "text-muted hover:bg-surface-subtle hover:text-ink"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.35 : 1.9} />
              {item.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-[22px] bg-ink p-4 text-white">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.13em] text-white/55 uppercase">
              Próximo objetivo
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-white/10">
              <ChevronRight size={15} />
            </span>
          </div>
          <p className="text-sm font-semibold">{dashboardData.athlete.raceName.replace("Maratón de Guadalajara", "Maratón GDL")}</p>
          <p className="mt-0.5 text-xs text-white/55">8 noviembre · {dashboardData.daysToRace} días</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"
        >
          <span className="grid size-9 place-items-center rounded-full bg-surface-subtle text-muted">
            <CircleUserRound size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{dashboardData.athlete.firstName} {dashboardData.athlete.lastName}</span>
            <span className="block text-[11px] text-muted">Primer maratón</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
