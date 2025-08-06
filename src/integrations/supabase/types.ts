export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blood_sugar_readings: {
        Row: {
          created_at: string
          date: string
          fasting: number | null
          hba1c: number | null
          id: string
          post_prandial: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          fasting?: number | null
          hba1c?: number | null
          id?: string
          post_prandial?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          fasting?: number | null
          hba1c?: number | null
          id?: string
          post_prandial?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_sugar_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_meal_plans: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          day_of_week: number
          fats: number | null
          food_item: string
          id: string
          meal_type: string
          notes: string | null
          proteins: number | null
          quantity: string
          updated_at: string
          weekly_plan_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          day_of_week: number
          fats?: number | null
          food_item: string
          id?: string
          meal_type: string
          notes?: string | null
          proteins?: number | null
          quantity: string
          updated_at?: string
          weekly_plan_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          day_of_week?: number
          fats?: number | null
          food_item?: string
          id?: string
          meal_type?: string
          notes?: string | null
          proteins?: number | null
          quantity?: string
          updated_at?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_meal_plans_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_logs: {
        Row: {
          active_energy_kcal: number | null
          activity_type: string
          calories_burned: number
          created_at: string
          date: string | null
          device_source: string | null
          device_sync_id: string | null
          distance_km: number | null
          duration_minutes: number
          elevation_gain: number | null
          heart_rate_avg: number | null
          heart_rate_max: number | null
          id: string
          steps: number | null
          user_id: string | null
        }
        Insert: {
          active_energy_kcal?: number | null
          activity_type: string
          calories_burned: number
          created_at?: string
          date?: string | null
          device_source?: string | null
          device_sync_id?: string | null
          distance_km?: number | null
          duration_minutes: number
          elevation_gain?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          steps?: number | null
          user_id?: string | null
        }
        Update: {
          active_energy_kcal?: number | null
          activity_type?: string
          calories_burned?: number
          created_at?: string
          date?: string | null
          device_source?: string | null
          device_sync_id?: string | null
          distance_km?: number | null
          duration_minutes?: number
          elevation_gain?: number | null
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          steps?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fitness_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: string | null
          carbs: number | null
          created_at: string
          date: string
          fats: number | null
          food_item: string
          id: string
          meal_type: string
          proteins: number | null
          quantity: string
          user_id: string | null
        }
        Insert: {
          calories?: string | null
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          food_item: string
          id?: string
          meal_type: string
          proteins?: number | null
          quantity: string
          user_id?: string | null
        }
        Update: {
          calories?: string | null
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          food_item?: string
          id?: string
          meal_type?: string
          proteins?: number | null
          quantity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_logs: {
        Row: {
          created_at: string
          id: string
          medicine_time: string
          taken_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_time: string
          taken_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medicine_time?: string
          taken_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_preferences: {
        Row: {
          created_at: string
          custom_name: string | null
          custom_time: string | null
          id: string
          slot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          custom_time?: string | null
          id?: string
          slot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          custom_time?: string | null
          id?: string
          slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dosage: string | null
          file_path: string
          file_type: string
          id: string
          medicine_name: string | null
          schedule: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          file_path: string
          file_type: string
          id?: string
          medicine_name?: string | null
          schedule?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dosage?: string | null
          file_path?: string
          file_type?: string
          id?: string
          medicine_name?: string | null
          schedule?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_calories_goal: number | null
          daily_carbs_goal: number | null
          daily_fats_goal: number | null
          daily_protein_goal: number | null
          email: string | null
          id: string
          preferred_language: string
        }
        Insert: {
          created_at?: string
          daily_calories_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          email?: string | null
          id: string
          preferred_language?: string
        }
        Update: {
          created_at?: string
          daily_calories_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          email?: string | null
          id?: string
          preferred_language?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          a1c_target: number | null
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          blood_sugar_target_max: number | null
          blood_sugar_target_min: number | null
          created_at: string
          diabetes_type: string | null
          dietary_restrictions: string[] | null
          disliked_foods: string[] | null
          favorite_foods: string[] | null
          food_preferences: string[] | null
          gender: string | null
          height_cm: number | null
          id: string
          medication_affects_appetite: boolean | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          a1c_target?: number | null
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_sugar_target_max?: number | null
          blood_sugar_target_min?: number | null
          created_at?: string
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          favorite_foods?: string[] | null
          food_preferences?: string[] | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          medication_affects_appetite?: boolean | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          a1c_target?: number | null
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          blood_sugar_target_max?: number | null
          blood_sugar_target_min?: number | null
          created_at?: string
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          favorite_foods?: string[] | null
          food_preferences?: string[] | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          medication_affects_appetite?: boolean | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      weekly_diet_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plan_name: string
          status: string | null
          total_weekly_calories: number | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_name?: string
          status?: string | null
          total_weekly_calories?: number | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_name?: string
          status?: string | null
          total_weekly_calories?: number | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
