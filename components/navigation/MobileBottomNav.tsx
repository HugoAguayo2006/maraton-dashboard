"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartNoAxesCombined, Gauge, Plus } from "lucide-react";

const items = [
  { label: "Inicio", href: "/dashboard", icon: Gauge },
  { label: "Plan", href: "/plan", icon: CalendarDays },
  { label: "Registrar", href: "/workouts/new", icon: Plus, emphasized: true },
  { label: "Progreso", href: "/progress", icon: ChartNoAxesCombined },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/88 px-3 pt-2 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.55rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span
                className={`grid place-items-center transition-all ${
                  item.emphasized
                    ? "-mt-6 size-12 rounded-full bg-accent text-white shadow-[0_7px_20px_rgba(36,120,238,0.3)]"
                    : "size-7"
                }`}
              >
                <Icon size={item.emphasized ? 23 : 21} strokeWidth={item.emphasized ? 2.4 : active ? 2.4 : 1.9} />
              </span>
              <span className={item.emphasized ? "-mb-1" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
