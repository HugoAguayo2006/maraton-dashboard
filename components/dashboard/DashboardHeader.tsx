import Link from "next/link";
import { Bell, CircleUserRound } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import type { AthleteProfile } from "@/types/training";

interface DashboardHeaderProps {
  athlete: AthleteProfile | null;
  date: string;
}

export function DashboardHeader({ athlete, date }: DashboardHeaderProps) {
  const formattedDate = formatShortDate(date);

  return (
    <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
      <div>
        <p className="mb-2 hidden text-xs font-bold tracking-[0.14em] text-muted uppercase lg:block">
          Marathon Dashboard
        </p>
        <h1 className="text-[2rem] leading-none font-bold tracking-[-0.045em] sm:text-[2.55rem]">
          Buenos días, {athlete?.firstName ?? "atleta"}
        </h1>
        <p className="mt-2 text-sm font-medium text-muted first-letter:uppercase sm:text-base">
          {formattedDate}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notificaciones"
          className="hidden size-11 place-items-center rounded-full border border-line bg-white text-muted transition-colors hover:text-ink sm:grid"
        >
          <Bell size={19} />
        </button>
        <Link
          href="/settings"
          aria-label="Abrir perfil"
          className="grid size-11 place-items-center rounded-full bg-ink text-white shadow-sm sm:size-12"
        >
          <CircleUserRound size={23} strokeWidth={1.8} />
        </Link>
      </div>
    </header>
  );
}
