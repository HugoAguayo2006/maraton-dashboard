export type WorkoutStatus = "pending" | "completed" | "modified" | "skipped";

export type SessionType =
  | "easy"
  | "long-run"
  | "tempo"
  | "intervals"
  | "gym"
  | "recovery"
  | "rest";

export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: "male" | "female" | "other";
  weightKg: number;
  raceName: string;
  raceDate: string;
  goal: string;
  naturalPace: string;
}

/** The prescribed session: what the athlete was expected to do. */
export interface TrainingPlanItem {
  id: string;
  date: string;
  weekNumber: number;
  title: string;
  sessionType: SessionType;
  distanceKm: number | null;
  targetPace: string | null;
  targetRpe: string | null;
  estimatedDurationMin: number | null;
  status: WorkoutStatus;
  warmup?: string;
  mainSet?: string;
  cooldown?: string;
  gym?: string;
  nutrition?: string;
  recovery?: string;
}

/** The completed session: what the athlete actually did. */
export interface WorkoutLog {
  id: string;
  planItemId: string | null;
  date: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  averagePace: string;
  rpe: number;
  pain: number;
  fatigue: number | null;
  sleepHours: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  giSymptoms: string | null;
  foodBefore: string | null;
  hydration: string | null;
  gels: string | null;
  notes: string | null;
}

export interface WeeklySummary {
  weekNumber: number;
  completedKm: number;
  plannedKm: number;
  completedWorkouts: number;
  totalWorkouts: number;
  pendingWorkouts: number;
}

export interface RecoveryMetrics {
  rpe: number | null;
  pain: number | null;
  fatigue: number | null;
  sleepHours: number | null;
}

export interface MileageWeek {
  label: string;
  kilometers: number;
  plannedKilometers?: number;
  averageRpe?: number;
}

export interface DashboardData {
  referenceDate: string;
  athlete: AthleteProfile | null;
  today: TrainingPlanItem | null;
  todayLog?: WorkoutLog;
  tomorrow: TrainingPlanItem | null;
  nextLongRun: TrainingPlanItem | null;
  weeklySummary: WeeklySummary;
  recovery: RecoveryMetrics;
  mileageHistory: MileageWeek[];
  recentWorkouts: WorkoutLog[];
  daysToLongRun: number | null;
  daysToRace: number | null;
  raceProgress: number | null;
}

export interface ProgressSummary {
  weeklyKilometers: number;
  totalKilometers: number;
  longestRunKm: number | null;
  averageRpe: number | null;
  planCompliance: number | null;
  averagePace: string | null;
}
