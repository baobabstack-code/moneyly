-- Migration to add custom_fields JSONB column to spending_plans
ALTER TABLE public.spending_plans ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
