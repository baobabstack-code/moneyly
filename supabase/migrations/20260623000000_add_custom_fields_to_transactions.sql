-- Migration to add custom_fields JSONB column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
