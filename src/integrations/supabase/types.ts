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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          browser: string | null
          campaign_id: string | null
          country: string | null
          created_at: string
          device: string | null
          email_client: string | null
          event_type: string
          id: string
          org_id: string
          signature_id: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email_client?: string | null
          event_type: string
          id?: string
          org_id: string
          signature_id?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email_client?: string | null
          event_type?: string
          id?: string
          org_id?: string
          signature_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          org_id: string
          target_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          org_id: string
          target_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          org_id?: string
          target_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience: string | null
          banner_id: string | null
          clicks: number
          created_at: string
          ends_at: string | null
          id: string
          name: string
          org_id: string
          starts_at: string | null
          status: string
          views: number
        }
        Insert: {
          audience?: string | null
          banner_id?: string | null
          clicks?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          org_id: string
          starts_at?: string | null
          status?: string
          views?: number
        }
        Update: {
          audience?: string | null
          banner_id?: string | null
          clicks?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          org_id?: string
          starts_at?: string | null
          status?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          archived_at: string | null
          created_at: string
          department_id: string | null
          email: string
          facebook: string | null
          first_name: string
          id: string
          instagram: string | null
          job_title: string | null
          last_name: string
          linkedin: string | null
          mobile: string | null
          office: string | null
          org_id: string
          phone: string | null
          photo_url: string | null
          pronouns: string | null
          status: string
          updated_at: string
          whatsapp: string | null
          x_handle: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          facebook?: string | null
          first_name: string
          id?: string
          instagram?: string | null
          job_title?: string | null
          last_name: string
          linkedin?: string | null
          mobile?: string | null
          office?: string | null
          org_id: string
          phone?: string | null
          photo_url?: string | null
          pronouns?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
          x_handle?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          facebook?: string | null
          first_name?: string
          id?: string
          instagram?: string | null
          job_title?: string | null
          last_name?: string
          linkedin?: string | null
          mobile?: string | null
          office?: string | null
          org_id?: string
          phone?: string | null
          photo_url?: string | null
          pronouns?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          connection_key_ciphertext: string | null
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          provider: string
          status?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          font: string | null
          id: string
          legal_disclaimer: string | null
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          font?: string | null
          id?: string
          legal_disclaimer?: string | null
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          font?: string | null
          id?: string
          legal_disclaimer?: string | null
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string
          data: Json
          employee_id: string | null
          html: string | null
          id: string
          name: string
          org_id: string
          status: string
          template_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          employee_id?: string | null
          html?: string | null
          id?: string
          name?: string
          org_id: string
          status?: string
          template_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          employee_id?: string | null
          html?: string | null
          id?: string
          name?: string
          org_id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "signatures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          org_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          renews_at: string | null
          seats: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          renews_at?: string | null
          seats?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          renews_at?: string | null
          seats?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          accent: string | null
          category: string
          created_at: string
          data: Json
          description: string | null
          id: string
          is_public: boolean
          layout: string
          name: string
          org_id: string | null
        }
        Insert: {
          accent?: string | null
          category: string
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          is_public?: boolean
          layout: string
          name: string
          org_id?: string | null
        }
        Update: {
          accent?: string | null
          category?: string
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          is_public?: boolean
          layout?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "marketing" | "hr" | "employee"
      plan_tier: "free" | "starter" | "business" | "enterprise"
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
    Enums: {
      app_role: ["owner", "admin", "marketing", "hr", "employee"],
      plan_tier: ["free", "starter", "business", "enterprise"],
    },
  },
} as const
