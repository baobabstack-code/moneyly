const { Client } = require('pg');

const connectionString = "postgres://postgres.xohuyqossycmailwgtzy:uuJO76CfoFDYKdJ1@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function applyMigrations() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const sql = `
-- 1. Shared Wallets Migration

-- Create shared_accounts table
CREATE TABLE IF NOT EXISTS public.shared_accounts (
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (account_id, user_id)
);
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their shared accounts" ON public.shared_accounts;
CREATE POLICY "Users can view their shared accounts" ON public.shared_accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can manage shared accounts" ON public.shared_accounts;
CREATE POLICY "Owners can manage shared accounts" ON public.shared_accounts FOR ALL USING (auth.uid() IN (SELECT sa.user_id FROM public.shared_accounts sa WHERE sa.account_id = shared_accounts.account_id AND sa.role = 'owner'));

-- Create account_invitations table
CREATE TABLE IF NOT EXISTS public.account_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invites sent to their email" ON public.account_invitations;
CREATE POLICY "Users can view invites sent to their email" ON public.account_invitations FOR SELECT USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own invites" ON public.account_invitations;
CREATE POLICY "Users can update their own invites" ON public.account_invitations FOR UPDATE USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Account owners can view/manage sent invites" ON public.account_invitations;
CREATE POLICY "Account owners can view/manage sent invites" ON public.account_invitations FOR ALL USING (auth.uid() IN (SELECT sa.user_id FROM public.shared_accounts sa WHERE sa.account_id = account_invitations.account_id AND sa.role = 'owner'));

-- Update RLS on accounts table
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their own or shared accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING (user_id = auth.uid() OR id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts" ON public.accounts FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts" ON public.accounts FOR UPDATE USING (user_id = auth.uid() OR id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING (user_id = auth.uid() OR id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid() AND role = 'owner'));

-- Update RLS on transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own or shared account transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid() OR account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()) OR to_account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid() OR account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (user_id = auth.uid() OR account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (user_id = auth.uid() OR account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()));

-- Trigger to automatically add the account creator to shared_accounts as 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_account() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shared_accounts (account_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_account_created ON public.accounts;
CREATE TRIGGER on_account_created AFTER INSERT ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();

-- 2. Recurring Bills Migration
CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  category_emoji TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  next_due_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring bills" ON recurring_bills;
CREATE POLICY "Users can view their own recurring bills" ON recurring_bills FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recurring bills" ON recurring_bills;
CREATE POLICY "Users can insert their own recurring bills" ON recurring_bills FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring bills" ON recurring_bills;
CREATE POLICY "Users can update their own recurring bills" ON recurring_bills FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring bills" ON recurring_bills;
CREATE POLICY "Users can delete their own recurring bills" ON recurring_bills FOR DELETE USING (auth.uid() = user_id);
    `;

    console.log("Executing SQL...");
    await client.query(sql);
    console.log("SQL executed successfully.");
  } catch (err) {
    console.error("Error applying migrations:", err);
  } finally {
    await client.end();
    console.log("Disconnected.");
  }
}

applyMigrations();
