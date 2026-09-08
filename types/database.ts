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
          sex: string;
          weight_kg: number;
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
          sex: string;
          weight_kg: number;
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
          title: string;
          planned_distance_km: number | null;
          target_pace_min_seconds: number | null;
          target_pace_max_seconds: number | null;
          target_rpe_min: number | null;
          target_rpe_max: number | null;
          estimated_duration_minutes: number | null;
          warmup: string | null;
          main_workout: string | null;
          cooldown: string | null;
          strength: string | null;
          nutrition: string | null;
          recovery_notes: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week: number;
          date: string;
          session_type: string;
          title: string;
          planned_distance_km?: number | null;
          target_pace_min_seconds?: number | null;
          target_pace_max_seconds?: number | null;
          target_rpe_min?: number | null;
          target_rpe_max?: number | null;
          estimated_duration_minutes?: number | null;
          warmup?: string | null;
          main_workout?: string | null;
          cooldown?: string | null;
          strength?: string | null;
          nutrition?: string | null;
          recovery_notes?: string | null;
          status?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
