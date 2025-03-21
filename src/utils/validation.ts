import { z } from 'zod';
import { EMAIL_PRIORITIES, EMAIL_CATEGORIES } from '../config/constants';

// Email metadata validation schema
export const emailMetadataSchema = z.object({
  email_id: z.string().min(1),
  user_id: z.string().min(1),
  subject: z.string().nullable(),
  sender: z.string().nullable(),
  received_at: z.string(),
  category: z.enum(Object.values(EMAIL_CATEGORIES) as [string, ...string[]]).nullable(),
  importance_score: z.number().int().min(1).max(10).nullable(),
  ai_summary: z.string().nullable(),
  suggested_actions: z.array(z.string()).nullable(),
  is_processed: z.boolean().default(false),
  has_draft: z.boolean().default(false),
  draft_id: z.string().nullable().optional(),
  applied_labels: z.array(z.string()).nullable().optional(),
  archived: z.boolean().default(false)
});

export type EmailMetadata = z.infer<typeof emailMetadataSchema>;

// Draft email validation schema
export const draftEmailSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  originalEmailId: z.string().min(1),
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string(),
  createdAt: z.string(),
  user_id: z.string().optional()
});

export type DraftEmail = z.infer<typeof draftEmailSchema>;

// Environment variables validation
export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SMARTLEAD_API_KEY: z.string().optional(),
  VITE_GOOGLE_CLIENT_ID: z.string().optional()
});

export function validateEnv(): void {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SMARTLEAD_API_KEY: import.meta.env.VITE_SMARTLEAD_API_KEY,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID
  };

  try {
    envSchema.parse(env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Don't throw error for optional variables
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Required environment variables are missing');
    }
  }
}