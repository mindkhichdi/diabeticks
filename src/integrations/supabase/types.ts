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
          taken_at: string
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
          id: string
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
        }
        Insert: {
          created_at?: string
          daily_calories_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          daily_calories_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fats_goal?: number | null
          daily_protein_goal?: number | null
          email?: string | null
          id?: string
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
