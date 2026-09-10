"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, Dumbbell, History } from "lucide-react";

const items = [
  { href: "/strength", label: "Fuerza", icon: Dumbbell },
  { href: "/strength/history", label: "Historial", icon: History },
  { href: "/strength/progress", label: "Progresión", icon: ChartNoAxesCombined },
] as const;

export function StrengthSectionNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de fuerza" className="mb-5 grid grid-cols-3 gap-1 rounded-[20px] border border-line bg-white p-1.5 shadow-sm">
      {items.map((item) => {
        const active = item.href === "/strength" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl px-2 text-[10px] font-bold transition-colors sm:text-xs ${active ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-surface-subtle hover:text-ink"}`}>
            <Icon size={16} className="shrink-0" /><span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

