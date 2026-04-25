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
      agenda_comments: {
        Row: {
          agenda_id: string
          comment: string
          created_at: string
          id: string
          read_by: string[] | null
          reviewer_cc: string
        }
        Insert: {
          agenda_id: string
          comment: string
          created_at?: string
          id?: string
          read_by?: string[] | null
          reviewer_cc: string
        }
        Update: {
          agenda_id?: string
          comment?: string
          created_at?: string
          id?: string
          read_by?: string[] | null
          reviewer_cc?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_comments_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_views: {
        Row: {
          created_at: string
          id: string
          records: Json
          reviewed_at: string | null
          reviewer_cc: string | null
          reviewer_comment: string | null
          status: string
          updated_at: string
          user_cc: string
        }
        Insert: {
          created_at?: string
          id?: string
          records?: Json
          reviewed_at?: string | null
          reviewer_cc?: string | null
          reviewer_comment?: string | null
          status?: string
          updated_at?: string
          user_cc: string
        }
        Update: {
          created_at?: string
          id?: string
          records?: Json
          reviewed_at?: string | null
          reviewer_cc?: string | null
          reviewer_comment?: string | null
          status?: string
          updated_at?: string
          user_cc?: string
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
      audit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
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
          number_projects: number | null
          number_weeks: number
        }
        Insert: {
          id?: number
          name: string
          number_projects?: number | null
          number_weeks?: number
        }
        Update: {
          id?: number
          name?: string
          number_projects?: number | null
          number_weeks?: number
        }
        Relationships: []
      }
      docente_semester_config: {
        Row: {
          computed_direct_hours: number
          confirmed: boolean
          conflicts: string[] | null
          created_at: string
          id: string
          observations: string[] | null
          responses: Json
          semester_label: string
          updated_at: string
          user_cc: string
        }
        Insert: {
          computed_direct_hours?: number
          confirmed?: boolean
          conflicts?: string[] | null
          created_at?: string
          id?: string
          observations?: string[] | null
          responses?: Json
          semester_label?: string
          updated_at?: string
          user_cc: string
        }
        Update: {
          computed_direct_hours?: number
          confirmed?: boolean
          conflicts?: string[] | null
          created_at?: string
          id?: string
          observations?: string[] | null
          responses?: Json
          semester_label?: string
          updated_at?: string
          user_cc?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      lineamientos_documents: {
        Row: {
          applied: boolean
          applied_at: string | null
          applied_by: string | null
          file_name: string
          file_path: string
          id: string
          rules_extracted: Json
          semester_label: string
          summary: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          applied?: boolean
          applied_at?: string | null
          applied_by?: string | null
          file_name: string
          file_path: string
          id?: string
          rules_extracted?: Json
          semester_label: string
          summary?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          applied?: boolean
          applied_at?: string | null
          applied_by?: string | null
          file_name?: string
          file_path?: string
          id?: string
          rules_extracted?: Json
          semester_label?: string
          summary?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      professional_careers: {
        Row: {
          description: string | null
          id: number
          id_faculty: number | null
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          id_faculty?: number | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          id_faculty?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_careers_id_faculty_fkey"
            columns: ["id_faculty"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_rules: {
        Row: {
          active: boolean
          category: string
          default_hours: number
          default_subjects: number
          hours: number
          id: string
          label: string
          priority: number
          rule_key: string
          subjects: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          default_hours?: number
          default_subjects?: number
          hours?: number
          id?: string
          label: string
          priority?: number
          rule_key: string
          subjects?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          default_hours?: number
          default_subjects?: number
          hours?: number
          id?: string
          label?: string
          priority?: number
          rule_key?: string
          subjects?: number
          updated_at?: string
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
      semester_archives: {
        Row: {
          agenda_comments: Json
          agenda_views: Json
          agendas: Json
          archived_at: string
          archived_by: string | null
          id: string
          schedules: Json
          semester_label: string
        }
        Insert: {
          agenda_comments?: Json
          agenda_views?: Json
          agendas?: Json
          archived_at?: string
          archived_by?: string | null
          id?: string
          schedules?: Json
          semester_label: string
        }
        Update: {
          agenda_comments?: Json
          agenda_views?: Json
          agendas?: Json
          archived_at?: string
          archived_by?: string | null
          id?: string
          schedules?: Json
          semester_label?: string
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      user_hierarchy: {
        Row: {
          created_at: string
          id: string
          supervisor_id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          supervisor_id: number
          user_id: number
        }
        Update: {
          created_at?: string
          id?: string
          supervisor_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_hierarchy_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hierarchy_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          cc: string
          email: string
          first_last_name: string
          first_name: string
          id: number
          id_faculty: number | null
          id_professional_career: number | null
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
          id_faculty?: number | null
          id_professional_career?: number | null
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
          id_faculty?: number | null
          id_professional_career?: number | null
          id_rol?: number
          id_state?: number
          password?: string
          second_last_name?: string | null
          second_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_faculty_fkey"
            columns: ["id_faculty"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_professional_career_fkey"
            columns: ["id_professional_career"]
            isOneToOne: false
            referencedRelation: "professional_careers"
            referencedColumns: ["id"]
          },
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
