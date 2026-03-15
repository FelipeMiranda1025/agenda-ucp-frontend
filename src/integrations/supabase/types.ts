export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_practices: {
        Row: {
          id: number
          name: string
          number_students: number
          number_weeks: number
        }
        Insert: {
          id?: number
          name: string
          number_students?: number
          number_weeks?: number
        }
        Update: {
          id?: number
          name?: string
          number_students?: number
          number_weeks?: number
        }
        Relationships: []
      }
      administrative_activities: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      agendas: {
        Row: {
          confirmed_at: string
          created_at: string
          data: Json
          docente_cc: string
          id: string
          semester_id: number | null
          subfunction_id: string
          total_horas: number
          updated_at: string
          user_id: number
        }
        Insert: {
          confirmed_at?: string
          created_at?: string
          data?: Json
          docente_cc: string
          id?: string
          semester_id?: number | null
          subfunction_id: string
          total_horas?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          confirmed_at?: string
          created_at?: string
          data?: Json
          docente_cc?: string
          id?: string
          semester_id?: number | null
          subfunction_id?: string
          total_horas?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendas_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semester"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      complementary_activities: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      degree_works: {
        Row: {
          id: number
          name: string
          number_projects: number
          number_weeks: number
        }
        Insert: {
          id?: number
          name: string
          number_projects?: number
          number_weeks?: number
        }
        Update: {
          id?: number
          name?: string
          number_projects?: number
          number_weeks?: number
        }
        Relationships: []
      }
      education_levels: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      faculties: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      indirect_teaching: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      investigations: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      professional_careers: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      semester: {
        Row: {
          description: string | null
          id: number
          number: number
        }
        Insert: {
          description?: string | null
          id?: number
          number: number
        }
        Update: {
          description?: string | null
          id?: number
          number?: number
        }
        Relationships: []
      }
      social_projects: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      states: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: number
          id_education_level: number | null
          id_faculty: number | null
          id_professional_career: number | null
          id_semester: number | null
          id_state: number | null
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          id_education_level?: number | null
          id_faculty?: number | null
          id_professional_career?: number | null
          id_semester?: number | null
          id_state?: number | null
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          id_education_level?: number | null
          id_faculty?: number | null
          id_professional_career?: number | null
          id_semester?: number | null
          id_state?: number | null
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_id_education_level_fkey"
            columns: ["id_education_level"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_id_faculty_fkey"
            columns: ["id_faculty"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_id_professional_career_fkey"
            columns: ["id_professional_career"]
            isOneToOne: false
            referencedRelation: "professional_careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_id_semester_fkey"
            columns: ["id_semester"]
            isOneToOne: false
            referencedRelation: "semester"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_id_state_fkey"
            columns: ["id_state"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_training: {
        Row: {
          id: number
          name: string
          number_weeks: number
          weekly_hours: number
        }
        Insert: {
          id?: number
          name: string
          number_weeks?: number
          weekly_hours?: number
        }
        Update: {
          id?: number
          name?: string
          number_weeks?: number
          weekly_hours?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          cc: string
          email: string
          first_last_name: string
          first_name: string
          id: number
          id_rol: number
          id_state: number
          password: string
          second_last_name: string | null
          second_name: string | null
        }
        Insert: {
          cc: string
          email: string
          first_last_name: string
          first_name: string
          id?: number
          id_rol: number
          id_state: number
          password: string
          second_last_name?: string | null
          second_name?: string | null
        }
        Update: {
          cc?: string
          email?: string
          first_last_name?: string
          first_name?: string
          id?: number
          id_rol?: number
          id_state?: number
          password?: string
          second_last_name?: string | null
          second_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_state_fkey"
            columns: ["id_state"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
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
