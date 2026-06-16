-- Create recurring_bills table
CREATE TABLE IF NOT EXISTS public.recurring_bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_due_date DATE NOT NULL,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    category_emoji TEXT,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;

-- recurring_bills policies
CREATE POLICY "Users can view their own recurring bills" ON public.recurring_bills
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recurring bills" ON public.recurring_bills
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recurring bills" ON public.recurring_bills
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recurring bills" ON public.recurring_bills
    FOR DELETE
    USING (user_id = auth.uid());
