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
  marathonExperience: "first" | "experienced";
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
  targetRpe: string;
  estimatedDurationMin: number;
  status: WorkoutStatus;
  warmup?: string;
  mainSet: string;
  cooldown?: string;
  gym?: string;
  nutrition?: string;
  recovery?: string;
}

/** The completed session: what the athlete actually did. */
export interface WorkoutLog {
  id: string;
  planItemId?: string;
  date: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  averagePace: string;
  rpe: number;
  pain: number;
  fatigue: number;
  sleepHours: number;
  averageHeartRate?: number;
  notes?: string;
}

export interface WeeklySummary {
  weekNumber: number;
  completedKm: number;
  plannedKm: number;
  completedWorkouts: number;
  totalWorkouts: number;
}

export interface RecoveryMetrics {
  rpe: number;
  pain: number;
  fatigue: number;
  sleepHours: number;
}

export interface MileageWeek {
  label: string;
  kilometers: number;
  plannedKilometers?: number;
  averageRpe?: number;
}

export interface DashboardData {
  referenceDate: string;
  athlete: AthleteProfile;
  today: TrainingPlanItem;
  todayLog?: WorkoutLog;
  tomorrow: TrainingPlanItem;
  nextLongRun: TrainingPlanItem;
  weeklySummary: WeeklySummary;
  recovery: RecoveryMetrics;
  mileageHistory: MileageWeek[];
  recentWorkouts: WorkoutLog[];
  daysToLongRun: number;
  daysToRace: number;
  raceProgress: number;
}

export interface ProgressSummary {
  weeklyKilometers: number;
  totalKilometers: number;
  longestRunKm: number;
  averageRpe: number;
  planCompliance: number;
  averagePace: string;
}
