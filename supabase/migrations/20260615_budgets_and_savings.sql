-- 1. Alter profiles table to add budgets
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_budget NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_budget NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12,2) DEFAULT 0.00;

-- 2. Drop existing constraint on transactions type and add new one
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('expense', 'income', 'savings'));

-- 3. Drop existing constraint on categories type and add new one
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK (type IN ('expense', 'income', 'savings'));
