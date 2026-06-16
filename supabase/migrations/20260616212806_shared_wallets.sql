-- Create shared_accounts table
CREATE TABLE IF NOT EXISTS public.shared_accounts (
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (account_id, user_id)
);

-- Enable RLS
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;

-- shared_accounts policies
CREATE POLICY "Users can view their shared accounts" ON public.shared_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage shared accounts" ON public.shared_accounts
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT sa.user_id FROM public.shared_accounts sa 
            WHERE sa.account_id = shared_accounts.account_id AND sa.role = 'owner'
        )
    );

-- Create account_invitations table
CREATE TABLE IF NOT EXISTS public.account_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

-- account_invitations policies
CREATE POLICY "Users can view invites sent to their email" ON public.account_invitations
    FOR SELECT
    USING (
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own invites" ON public.account_invitations
    FOR UPDATE
    USING (
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Account owners can view/manage sent invites" ON public.account_invitations
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT sa.user_id FROM public.shared_accounts sa 
            WHERE sa.account_id = account_invitations.account_id AND sa.role = 'owner'
        )
    );

-- Update RLS on accounts table
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts" ON public.accounts
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts" ON public.accounts
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts" ON public.accounts
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts" ON public.accounts
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid() AND role = 'owner')
    );

-- Update RLS on transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid()) OR
        to_account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        account_id IN (SELECT account_id FROM public.shared_accounts WHERE user_id = auth.uid())
    );

-- Trigger to automatically add the account creator to shared_accounts as 'owner'
CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shared_accounts (account_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_account_created ON public.accounts;
CREATE TRIGGER on_account_created
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();
