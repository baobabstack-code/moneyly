-- Tracks which budget alert thresholds have already been sent this month.
-- Format: comma-separated list e.g. '80,100'
-- Reset to empty string at the start of each month by the alert route.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS budget_alerts_sent TEXT NOT NULL DEFAULT '';
