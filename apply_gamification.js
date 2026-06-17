const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function applyGamification() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const sql = `
-- 1. Add Gamification Columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_log_date TEXT;

-- 2. Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own badges" ON public.user_badges;
CREATE POLICY "Users can delete their own badges" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
    `;

    console.log("Executing Gamification SQL...");
    await client.query(sql);
    console.log("Gamification SQL executed successfully.");
  } catch (err) {
    console.error("Error applying gamification migrations:", err);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

applyGamification();
