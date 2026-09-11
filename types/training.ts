export type WorkoutStatus = "pending" | "completed" | "modified" | "skipped";

export type AthleteSex = "male" | "female" | "prefer_not_to_say";

export type StrengthUnit = "kg" | "lbs";

export type WorkoutSource = "manual" | "strava";

export type RunActivityType =
  | "easy"
  | "long_run"
  | "tempo"
  | "interval"
  | "race"
  | "recovery";

export type ExerciseCategory = "upper_body" | "lower_body" | "other";

export type Equipment =
  | "Ninguno"
  | "Barra"
  | "Mancuerna"
  | "Máquina"
  | "Polea"
  | "Kettlebell"
  | "Banda"
  | "Disco";

export type MuscleGroup =
  | "Pecho"
  | "Espalda"
  | "Bíceps"
  | "Tríceps"
  | "Hombros"
  | "Trapecio"
  | "Antebrazo"
  | "Abdominales"
  | "Cuádriceps"
  | "Isquiotibiales"
  | "Glúteos"
  | "Pantorrillas"
  | "Aductores"
  | "Abductores"
  | "Cardio"
  | "Full Body"
  | "Movilidad";

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
  strengthUnit: StrengthUnit;
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

export interface Exercise {
  id: string;
  name: string;
  nameEs: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  imageUrl: string | null;
  description: string | null;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  orderNumber: number;
  notes: string | null;
  exercise: Exercise;
}

export interface StrengthRoutine {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  exercises: RoutineExercise[];
}

export interface StrengthSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  weightLbs: number | null;
  repetitions: number;
  rir: number | null;
  notes: string | null;
}

export interface StrengthSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  orderNumber: number;
  notes: string | null;
  exercise: Exercise;
  sets: StrengthSet[];
}

export interface StrengthSession {
  id: string;
  routineId: string | null;
  routineName: string | null;
  trainingPlanItemId: string | null;
  date: string;
  durationMinutes: number | null;
  unit: StrengthUnit;
  notes: string | null;
  createdAt: string;
  exercises: StrengthSessionExercise[];
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
}

export interface StrengthProgressPoint {
  sessionId: string;
  date: string;
  maximumKg: number;
  volumeKg: number;
  maximumRepetitions: number;
  bestSet: string;
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
  rpe: number | null;
  pain: number | null;
  fatigue: number | null;
  sleepHours: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  giSymptoms: string | null;
  foodBefore: string | null;
  hydration: string | null;
  gels: string | null;
  notes: string | null;
  source: WorkoutSource;
  stravaActivityId: string | null;
  activityType: RunActivityType;
  providerActivityType: string | null;
  feeling: number | null;
  locationName: string | null;
  locationCity: string | null;
  routeName: string | null;
  latitude: number | null;
  longitude: number | null;
  elevationGain: number | null;
  calories: number | null;
  weather: Record<string, unknown> | null;
}

export interface RunSplit {
  id: string;
  workoutId: string;
  kilometer: number;
  paceSeconds: number;
  distanceMeters: number;
  elevationDifference: number | null;
}

export interface ActivityRoute {
  id: string;
  workoutId: string;
  polyline: string;
  distanceStream: number[];
  elevationStream: number[];
}

export interface WorkoutDetail {
  workout: WorkoutLog;
  splits: RunSplit[];
  route: ActivityRoute | null;
}

export interface StravaActivitySummary {
  id: string;
  name: string;
  sportType: string;
  date: string;
  distanceKm: number;
  durationSeconds: number;
  averagePace: string;
  elevationGain: number | null;
  averageHeartRate: number | null;
  importedWorkoutId: string | null;
}

export interface IntegrationStatus {
  connected: boolean;
  providerUserId: string | null;
  expiresAt: string | null;
  scopes: string[];
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
  selectedKilometers: number;
  selectedDurationSeconds: number;
  selectedElevationGain: number;
}
