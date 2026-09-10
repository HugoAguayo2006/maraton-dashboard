export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampColumns = {
  id: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      athlete_profiles: {
        Row: TimestampColumns & {
          user_id: string;
          name: string;
          age: number;
          date_of_birth: string | null;
          sex: string;
          weight_kg: number;
          avatar_url: string | null;
          goal_event_name: string | null;
          goal_event_distance_km: number | null;
          goal_event_date: string | null;
          goal_event_location: string | null;
          goal_event_objective: string | null;
          strength_unit: string;
          marathon_name: string;
          marathon_date: string;
          goal: string;
          natural_pace_seconds: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          age: number;
          date_of_birth?: string | null;
          sex: string;
          weight_kg: number;
          avatar_url?: string | null;
          goal_event_name?: string | null;
          goal_event_distance_km?: number | null;
          goal_event_date?: string | null;
          goal_event_location?: string | null;
          goal_event_objective?: string | null;
          strength_unit?: string;
          marathon_name: string;
          marathon_date: string;
          goal: string;
          natural_pace_seconds: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["athlete_profiles"]["Insert"]>;
        Relationships: [];
      };
      training_plan_items: {
        Row: TimestampColumns & {
          user_id: string;
          week: number;
          date: string;
          session_type: string;
          effort_type: string | null;
          title: string;
          planned_distance_km: number | null;
          target_pace_min_seconds: number | null;
          target_pace_max_seconds: number | null;
          target_pace_text: string | null;
          target_rpe_min: number | null;
          target_rpe_max: number | null;
          target_rpe_text: string | null;
          estimated_duration_minutes: number | null;
          warmup: string | null;
          main_workout: string | null;
          cooldown: string | null;
          strength: string | null;
          nutrition: string | null;
          recovery_notes: string | null;
          status: string;
          source_row_number: number | null;
          source_data: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          week: number;
          date: string;
          session_type: string;
          effort_type?: string | null;
          title: string;
          planned_distance_km?: number | null;
          target_pace_min_seconds?: number | null;
          target_pace_max_seconds?: number | null;
          target_pace_text?: string | null;
          target_rpe_min?: number | null;
          target_rpe_max?: number | null;
          target_rpe_text?: string | null;
          estimated_duration_minutes?: number | null;
          warmup?: string | null;
          main_workout?: string | null;
          cooldown?: string | null;
          strength?: string | null;
          nutrition?: string | null;
          recovery_notes?: string | null;
          status?: string;
          source_row_number?: number | null;
          source_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_plan_items"]["Insert"]>;
        Relationships: [];
      };
      workout_logs: {
        Row: TimestampColumns & {
          user_id: string;
          training_plan_item_id: string | null;
          date: string;
          distance_km: number;
          duration_seconds: number;
          average_pace_seconds: number;
          rpe: number;
          pain: number;
          fatigue: number | null;
          sleep_hours: number | null;
          average_hr: number | null;
          max_hr: number | null;
          gi_symptoms: string | null;
          food_before: string | null;
          hydration: string | null;
          gels: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          training_plan_item_id?: string | null;
          date: string;
          distance_km: number;
          duration_seconds: number;
          average_pace_seconds: number;
          rpe: number;
          pain: number;
          fatigue?: number | null;
          sleep_hours?: number | null;
          average_hr?: number | null;
          max_hr?: number | null;
          gi_symptoms?: string | null;
          food_before?: string | null;
          hydration?: string | null;
          gels?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_owner_fk";
            columns: ["training_plan_item_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "training_plan_items";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      exercise_library: {
        Row: TimestampColumns & {
          name: string;
          name_es: string;
          category: string;
          muscle_group: string;
          equipment: string;
          image_url: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          name_es: string;
          category: string;
          muscle_group: string;
          equipment: string;
          image_url?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_library"]["Insert"]>;
        Relationships: [];
      };
      strength_routines: {
        Row: TimestampColumns & {
          user_id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["strength_routines"]["Insert"]>;
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          order_number: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          order_number: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["routine_exercises"]["Insert"]>;
        Relationships: [];
      };
      strength_sessions: {
        Row: TimestampColumns & {
          user_id: string;
          routine_id: string | null;
          training_plan_item_id: string | null;
          date: string;
          duration_minutes: number | null;
          unit: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          training_plan_item_id?: string | null;
          date: string;
          duration_minutes?: number | null;
          unit?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["strength_sessions"]["Insert"]>;
        Relationships: [];
      };
      strength_session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_number: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          order_number: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["strength_session_exercises"]["Insert"]>;
        Relationships: [];
      };
      strength_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg: number | null;
          weight_lbs: number | null;
          repetitions: number;
          rir: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg?: number | null;
          weight_lbs?: number | null;
          repetitions: number;
          rir?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["strength_sets"]["Insert"]>;
        Relationships: [];
      };
      ai_recommendations: {
        Row: TimestampColumns & {
          user_id: string;
          status: string;
          summary: string;
          reason: string;
          suggested_changes: Json;
          warning: string | null;
          applied: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          summary: string;
          reason: string;
          suggested_changes?: Json;
          warning?: string | null;
          applied?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_recommendations"]["Insert"]>;
        Relationships: [];
      };
      training_plan_imports: {
        Row: TimestampColumns & {
          user_id: string;
          source_name: string;
          source_sha256: string;
          sheet_names: Json;
          workbook_snapshot: Json;
          imported_row_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_name: string;
          source_sha256: string;
          sheet_names?: Json;
          workbook_snapshot?: Json;
          imported_row_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_plan_imports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      seed_exercise_library: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
