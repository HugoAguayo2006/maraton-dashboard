import type { TrainingPlanItem } from "@/types/training";

export function isEligiblePlanSession(item: TrainingPlanItem): boolean {
  return item.sessionType !== "rest" && item.effortType !== "rest";
}

export function isCompletedPlanSession(item: TrainingPlanItem): boolean {
  return isEligiblePlanSession(item) && item.status === "completed";
}

export function isPendingPlanSession(item: TrainingPlanItem): boolean {
  return isEligiblePlanSession(item) && ["pending", "modified"].includes(item.status);
}

export function calculatePlanCompliance(items: TrainingPlanItem[]): number | null {
  const eligible = items.filter(isEligiblePlanSession);
  if (eligible.length === 0) return null;
  const completed = eligible.filter(isCompletedPlanSession);
  return Math.round((completed.length / eligible.length) * 100);
}
