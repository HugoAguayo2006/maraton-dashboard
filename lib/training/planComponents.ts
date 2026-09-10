import type { TrainingPlanItem } from "@/types/training";

type PlanComponentsSource = Pick<
  TrainingPlanItem,
  "distanceKm" | "gym" | "sessionType"
>;

export function hasRunningComponent(item: PlanComponentsSource): boolean {
  return (item.distanceKm ?? 0) > 0;
}

export function hasStrengthComponent(item: PlanComponentsSource): boolean {
  return item.sessionType === "gym"
    || item.sessionType === "strength"
    || Boolean(item.gym?.trim());
}

export function isPlanItemFullyCompleted(
  item: PlanComponentsSource,
  runCompleted: boolean,
  strengthCompleted: boolean,
): boolean {
  const requiresRun = hasRunningComponent(item);
  const requiresStrength = hasStrengthComponent(item);

  if (!requiresRun && !requiresStrength) return false;
  return (!requiresRun || runCompleted) && (!requiresStrength || strengthCompleted);
}
