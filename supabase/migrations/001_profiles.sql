-- Run this migration in your Supabase SQL editor to create the profiles table.

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  preferences  jsonb NOT NULL DEFAULT '{"currency":"INR","date_format":"DD/MM/YYYY","month_start_day":1}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{"anomaly_alerts":true,"weekly_summary":true,"subscription_reminders":true}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: update own" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles: delete own" ON profiles
  FOR DELETE USING (auth.uid() = user_id);
