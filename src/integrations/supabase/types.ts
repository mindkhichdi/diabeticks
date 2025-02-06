export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      fitness_logs: {
        Row: {
          activity_type: string
          calories_burned: number
          created_at: string
          date: string | null
          distance_km: number | null
          duration_minutes: number
          id: string
          steps: number | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          calories_burned: number
          created_at?: string
          date?: string | null
          distance_km?: number | null
          duration_minutes: number
          id?: string
          steps?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          calories_burned?: number
          created_at?: string
          date?: string | null
          distance_km?: number | null
          duration_minutes?: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
