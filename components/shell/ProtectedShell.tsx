import type { ReactNode } from "react";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { requireUser } from "@/lib/auth";
import { getAthleteProfile } from "@/lib/data/athlete";
import { differenceInCalendarDays, getTodayIso } from "@/lib/date";

export async function ProtectedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getAthleteProfile();
  const daysToRace = profile
    ? Math.max(0, differenceInCalendarDays(getTodayIso(), profile.raceDate))
    : null;

  return (
    <>
      <DesktopSidebar profile={profile} userEmail={user.email} daysToRace={daysToRace} />
      <div className="min-h-screen lg:pl-[264px]">
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-12 lg:pt-8 xl:px-12">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
