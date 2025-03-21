import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { 
  emailMetadataSchema, 
  draftEmailSchema, 
  type EmailMetadata, 
  type DraftEmail 
} from '../utils/validation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export async function storeEmailMetadata(emailData: EmailMetadata) {
  try {
    // Validate the email data using Zod schema
    const validatedData = emailMetadataSchema.parse(emailData);

    const { data, error } = await supabase
      .from('email_metadata')
      .insert([{ ...validatedData, is_processed: true }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error storing email metadata:', error);
    throw new Error('Failed to store email metadata');
  }
}

export async function storeDraftEmail(draftData: DraftEmail) {
  try {
    // Validate the draft data using Zod schema
    const validatedData = draftEmailSchema.parse(draftData);

    const { data, error } = await supabase
      .from('email_drafts')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error storing draft email:', error);
    throw new Error('Failed to store draft email');
  }
}

export async function getDraftEmails(userId: string) {
  try {
    const { data, error } = await supabase
      .from('email_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching draft emails:', error);
    throw new Error('Failed to fetch draft emails');
  }
}

export async function deleteDraftEmail(draftId: string) {
  try {
    const { error } = await supabase
      .from('email_drafts')
      .delete()
      .eq('id', draftId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting draft email:', error);
    throw new Error('Failed to delete draft email');
  }
}