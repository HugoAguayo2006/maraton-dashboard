import Link from "next/link";
import { AthleteAvatar } from "@/components/profile/AthleteAvatar";
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
        <Link
          href="/settings"
          aria-label="Abrir perfil"
          className="rounded-full shadow-sm"
        >
          <AthleteAvatar name={athlete?.name ?? "Atleta"} src={athlete?.avatarUrl} className="size-11 text-xs sm:size-12" />
        </Link>
      </div>
    </header>
  );
}
