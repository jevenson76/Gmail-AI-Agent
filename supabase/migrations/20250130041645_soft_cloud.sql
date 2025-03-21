/*
  # Email Metadata Schema

  1. New Tables
    - `email_metadata`
      - `id` (uuid, primary key)
      - `email_id` (text, Gmail message ID)
      - `user_id` (uuid, references auth.users)
      - `subject` (text)
      - `sender` (text)
      - `received_at` (timestamptz)
      - `category` (text)
      - `importance_score` (integer)
      - `ai_summary` (text)
      - `suggested_actions` (jsonb)
      - `is_processed` (boolean)
      - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on `email_metadata` table
    - Add policies for authenticated users
*/

CREATE TABLE email_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  subject text,
  sender text,
  received_at timestamptz NOT NULL,
  category text,
  importance_score integer,
  ai_summary text,
  suggested_actions jsonb,
  is_processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email_id, user_id)
);

ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own email metadata"
  ON email_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email metadata"
  ON email_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email metadata"
  ON email_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);