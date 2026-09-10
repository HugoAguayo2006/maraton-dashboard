export type WorkoutStatus = "pending" | "completed" | "modified" | "skipped";

export type AthleteSex = "male" | "female" | "prefer_not_to_say";

export type EffortType =
  | "recovery"
  | "easy"
  | "steady_moderate"
  | "tempo_threshold"
  | "intervals_speed"
  | "long_run"
  | "rest";

export type SessionType =
  | "easy"
  | "long-run"
  | "tempo"
  | "intervals"
  | "gym"
  | "strength"
  | "recovery"
  | "rest";

export interface AthleteProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  age: number | null;
  sex: AthleteSex;
  weightKg: number;
  avatarUrl: string | null;
  avatarPath: string | null;
  goalEventName: string | null;
  goalEventDistanceKm: number | null;
  goalEventDate: string | null;
  goalEventLocation: string | null;
  goalEventObjective: string | null;
  raceName: string;
  raceDate: string;
  goal: string;
  naturalPace: string;
  naturalPaceSeconds: number;
}

export interface PaceGuideEntry {
  id: string;
  type: string;
  pace: string;
  rpe: string;
  sensation: string;
  purpose: string;
  practicalRule: string;
  effortType: EffortType | null;
}

export interface GuideTopicEntry {
  id: string;
  topic: string;
  description: string;
}

export interface GymExerciseEntry {
  exercise: string;
  sets: string;
  reps: string;
  rir: string;
  rest: string;
  notes: string;
}

export interface GymGuideEntry {
  id: "a" | "b" | "light";
  name: string;
  description: string;
  exercises: readonly GymExerciseEntry[];
}

/** The prescribed session: what the athlete was expected to do. */
export interface TrainingPlanItem {
  id: string;
  date: string;
  weekNumber: number;
  title: string;
  sessionType: SessionType;
  effortType: EffortType | null;
  distanceKm: number | null;
  targetPace: string | null;
  targetRpe: string | null;
  targetPaceText: string | null;
  targetRpeText: string | null;
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
  averagePain: number | null;
  planCompliance: number | null;
  averagePace: string | null;
}
