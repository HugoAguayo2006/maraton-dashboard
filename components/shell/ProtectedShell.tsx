import type { ReactNode } from "react";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { requireUser } from "@/lib/auth";
import { getAthleteProfile } from "@/lib/data/athlete";
import { differenceInCalendarDays, getTodayIso } from "@/lib/date";
import { isAthleteProfileComplete } from "@/lib/profile/profile";
import { redirect } from "next/navigation";
import { BoltWidget } from "@/components/bolt/BoltWidget";
import { isBoltConfigured } from "@/lib/ai/config";

export async function ProtectedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getAthleteProfile();
  if (!isAthleteProfileComplete(profile)) redirect("/onboarding");
  const daysToRace = profile
    ? Math.max(0, differenceInCalendarDays(getTodayIso(), profile.raceDate))
    : null;

  return (
    <>
      <DesktopSidebar profile={profile} userEmail={user.email} daysToRace={daysToRace} />
      <div className="min-h-screen min-h-dvh min-w-0 min-[1200px]:pl-[264px]">
        <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-7 min-[1200px]:px-10 min-[1200px]:pt-8 min-[1200px]:pb-12 min-[1440px]:px-12">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      {isBoltConfigured() && <BoltWidget />}
    </>
  );
}
