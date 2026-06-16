-- ────────────────────────────────────────────────────────────
-- Daily Reminder Opt-in Column
-- Adds reminder_email_enabled to profiles.
-- Defaults to TRUE so all existing users are opted in.
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminder_email_enabled BOOLEAN NOT NULL DEFAULT true;
