export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      email_metadata: {
        Row: {
          id: string
          email_id: string
          user_id: string
          subject: string | null
          sender: string | null
          received_at: string
          category: string | null
          importance_score: number | null
          ai_summary: string | null
          suggested_actions: Json | null
          is_processed: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email_id: string
          user_id: string
          subject?: string | null
          sender?: string | null
          received_at: string
          category?: string | null
          importance_score?: number | null
          ai_summary?: string | null
          suggested_actions?: Json | null
          is_processed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email_id?: string
          user_id?: string
          subject?: string | null
          sender?: string | null
          received_at?: string
          category?: string | null
          importance_score?: number | null
          ai_summary?: string | null
          suggested_actions?: Json | null
          is_processed?: boolean | null
          created_at?: string | null
        }
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
  }
}