-- Add budget_limit column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS budget_limit NUMERIC(12,2) DEFAULT 0.00;
