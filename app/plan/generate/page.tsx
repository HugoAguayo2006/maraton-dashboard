import type { Metadata } from "next";
import { BoltPlanGenerator } from "@/components/bolt/BoltPlanGenerator";
import { isBoltConfigured } from "@/lib/ai/config";
import { getBoltPlanPreferences } from "@/lib/ai/preferences";
import { getAthleteProfile } from "@/lib/data/athlete";
import { getAllTrainingPlanItems } from "@/lib/data/trainingPlan";

export const metadata: Metadata = { title: "Plan con Bolt AI" };

export default async function GeneratePlanPage() {
  const [profile, preferences, plan] = await Promise.all([
    getAthleteProfile(),
    getBoltPlanPreferences(),
    getAllTrainingPlanItems(),
  ]);

  return (
    <BoltPlanGenerator
      initialPreferences={preferences}
      goalName={profile?.raceName ?? "tu carrera objetivo"}
      goalDate={profile?.raceDate ?? new Date().toISOString().slice(0, 10)}
      hasExistingPlan={plan.some((item) => item.status !== "completed")}
      enabled={isBoltConfigured()}
    />
  );
}
