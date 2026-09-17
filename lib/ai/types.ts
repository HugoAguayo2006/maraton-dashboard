import type { EffortType, SessionType } from "@/types/training";

export type BoltContextType = "global" | "dashboard" | "plan" | "workout" | "progress" | "guide";
export type BoltMessageRole = "user" | "assistant";
export type BoltOperation = "chat" | "plan_generation" | "progress_analysis" | "plan_change";
export type BoltPlanChangeStatus = "proposed" | "applied" | "rejected" | "expired";

export interface BoltMessage {
  id: string;
  conversationId: string;
  role: BoltMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BoltConversation {
  id: string;
  title: string;
  contextType: BoltContextType;
  contextRefId: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoltPlanSession {
  date: string;
  week: number;
  sessionType: SessionType;
  title: string;
  distanceKm: number | null;
  targetPaceText: string | null;
  targetRpeText: string | null;
  effortType: EffortType | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  mainWorkout: string | null;
  cooldown: string | null;
  strength: string | null;
  nutrition: string | null;
  recoveryNotes: string | null;
  status: "pending" | "modified" | "skipped";
}

export interface BoltPlanChangeInstruction {
  action: "add" | "update" | "skip";
  date: string;
  currentTitle: string | null;
  session: BoltPlanSession;
}

export interface BoltPlanChangeSuggestion {
  reason: string;
  summary: string;
  changes: BoltPlanChangeInstruction[];
}

export interface BoltAIResponse {
  title: string;
  answer: string;
  relevantData: string[];
  recommendation: string | null;
  suggestedPrompts: string[];
  safetyNotice: string | null;
  planChange: BoltPlanChangeSuggestion | null;
}

export interface BoltPlanOutput {
  planSummary: string;
  weeks: number;
  runningDaysPerWeek: number;
  strengthDaysPerWeek: number;
  sessions: BoltPlanSession[];
}

export interface BoltPlanChangePreview {
  id: string;
  kind: "session_change" | "plan_generation";
  status: BoltPlanChangeStatus;
  reason: string;
  summary: string;
  previousPlan: BoltPlanSession[];
  newPlan: BoltPlanSession[];
  userConfirmed: boolean;
  createdAt: string;
}

export interface BoltToolResult<T> {
  tool: string;
  data: T;
}

export interface BoltContextPlanItem {
  date: string;
  week: number;
  title: string;
  sessionType: SessionType;
  effortType: EffortType | null;
  distanceKm: number | null;
  targetPace: string | null;
  targetRpe: string | null;
  status: string;
  warmup: string | null;
  mainWorkout: string | null;
  cooldown: string | null;
  strength: string | null;
  nutrition: string | null;
  recovery: string | null;
}

export interface BoltContextWorkout {
  date: string;
  title: string;
  activityType: string;
  distanceKm: number;
  durationSeconds: number;
  averagePace: string;
  rpe: number | null;
  pain: number | null;
  fatigue: number | null;
  sleepHours: number | null;
  elevationGain: number | null;
  averageHeartRate: number | null;
  source: string;
}

export interface BoltContext {
  generatedAt: string;
  pageContext: { type: BoltContextType; refId: string | null };
  athlete: {
    age: number | null;
    weightKg: number;
    sex: string;
    naturalPace: string;
  } | null;
  goal: {
    name: string;
    distanceKm: number | null;
    date: string;
    location: string | null;
    objective: string;
    daysRemaining: number;
  } | null;
  today: BoltContextPlanItem | null;
  nextLongRun: BoltContextPlanItem | null;
  selectedPlan: BoltContextPlanItem | null;
  upcomingPlan: BoltContextPlanItem[];
  recentWorkouts: BoltContextWorkout[];
  selectedWorkout: BoltContextWorkout | null;
  recentStrength: Array<{
    date: string;
    routineName: string | null;
    durationMinutes: number | null;
    setCount: number;
    volumeKg: number;
  }>;
  load: {
    kilometers7Days: number;
    kilometers14Days: number;
    kilometers28Days: number;
    sessions7Days: number;
    sessions28Days: number;
    averageRpe14Days: number | null;
    averagePain14Days: number | null;
    longestRun28Days: number | null;
    completedPlan14Days: number;
    skippedPlan14Days: number;
  };
  preferences: {
    experienceLevel: string | null;
    runningDays: number[];
    strengthDays: number[];
    preferredLongRunDay: number | null;
    currentWeeklyKm: number | null;
    longestRecentRunKm: number | null;
    timeConstraints: string | null;
    trainingNotes: string | null;
  } | null;
  guide: {
    activeSection: "paces" | "gym" | "rules" | null;
    paceReferences: Array<{ type: string; pace: string; rpe: string; rule: string }>;
    practicalRules: Array<{ topic: string; description: string }>;
  };
}

export interface AIProviderResult<T> {
  data: T;
  tokenCount: number | null;
}

export interface AIProvider {
  generateChat(input: {
    context: BoltContext;
    history: Array<{ role: BoltMessageRole; content: string }>;
    message: string;
  }): Promise<AIProviderResult<BoltAIResponse>>;
  generatePlan(input: {
    context: BoltContext;
    preferences: BoltPlanGenerationPreferences;
    reason: string;
  }): Promise<AIProviderResult<BoltPlanOutput>>;
}

export interface BoltPlanGenerationPreferences {
  experienceLevel: "beginner" | "intermediate" | "advanced";
  runningDays: number[];
  strengthDays: number[];
  preferredLongRunDay: number;
  currentWeeklyKm: number;
  longestRecentRunKm: number;
  timeConstraints: string | null;
  trainingNotes: string | null;
}
