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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          approved: boolean | null
          created_at: string
          description: string
          id: string
          logo_url: string | null
          name: string
          status: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          description: string
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          map_data: Json | null
          mind_map_id: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          map_data?: Json | null
          mind_map_id: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          map_data?: Json | null
          mind_map_id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_projects: {
        Row: {
          created_at: string | null
          description: string | null
          graph_data: Json
          id: string
          prompt: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          graph_data?: Json
          id?: string
          prompt: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          graph_data?: Json
          id?: string
          prompt?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mind_maps: {
        Row: {
          created_at: string | null
          description: string | null
          first_prompt: string
          graph_data: Json
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          first_prompt: string
          graph_data?: Json
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          first_prompt?: string
          graph_data?: Json
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string | null
          id: string
          mind_map_id: string
          share_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mind_map_id: string
          share_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mind_map_id?: string
          share_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          last_daily_credit_claimed_at: string | null
          monthly_credits_remaining: number
          monthly_credits_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          last_daily_credit_claimed_at?: string | null
          monthly_credits_remaining?: number
          monthly_credits_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          last_daily_credit_claimed_at?: string | null
          monthly_credits_remaining?: number
          monthly_credits_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          dodo_customer_id: string | null
          dodo_status: string
          dodo_subscription_id: string | null
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_status?: string
          dodo_subscription_id?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dodo_customer_id?: string | null
          dodo_status?: string
          dodo_subscription_id?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_daily_credits: {
        Args: { p_timezone?: string; p_user_id: string }
        Returns: Json
      }
      create_or_update_share_link: {
        Args: {
          p_mind_map_id: string
          p_share_token: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          share_token: string
          updated_at: string
        }[]
      }
      deduct_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: undefined
      }
      delete_mind_map_with_chats: {
        Args: { p_mind_map_id: string; p_user_id: string }
        Returns: undefined
      }
      get_share_link: {
        Args: { p_mind_map_id: string; p_user_id: string }
        Returns: {
          created_at: string
          id: string
          share_token: string
          updated_at: string
        }[]
      }
      get_shared_mind_map_by_token: {
        Args: { p_share_token: string }
        Returns: {
          description: string
          graph_data: Json
          mind_map_id: string
          title: string
        }[]
      }
      initialize_user_credits: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          credits: number
          id: string
          last_daily_credit_claimed_at: string | null
          monthly_credits_remaining: number
          monthly_credits_used: number | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      revoke_share_link: {
        Args: { p_mind_map_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      chat_role: "user" | "ai"
      subscription_tier: "free" | "hobby" | "pro"
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
      chat_role: ["user", "ai"],
      subscription_tier: ["free", "hobby", "pro"],
    },
  },
} as const
