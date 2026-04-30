-- ============================================================
-- Fix recursive RLS on profiles table
--
-- The multi-tenant migration added policies that query profiles
-- from within profiles RLS policies, causing infinite recursion
-- and 500 errors on every profile/application read.
--
-- Fix: a SECURITY DEFINER helper that bypasses RLS to read the
-- current user's role, used in all policies that need it.
-- ============================================================

-- Helper: returns the role of the currently authenticated user.
-- SECURITY DEFINER + search_path lock = bypasses RLS safely.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- Re-create profiles policies without recursion
-- ────────────────────────────────────────────────────────────
drop policy if exists "Customers view own profile"         on public.profiles;
drop policy if exists "Customers insert own profile"       on public.profiles;
drop policy if exists "Customers update own profile"       on public.profiles;
drop policy if exists "Admins view store customer profiles" on public.profiles;
drop policy if exists "Super admins view all profiles"     on public.profiles;
drop policy if exists "Super admins update any profile"    on public.profiles;

-- Customers: own row only
create policy "Customers view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Customers insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Customers update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins: view profiles of customers who applied to their store
-- Uses get_my_role() to avoid querying profiles inside a profiles policy.
create policy "Admins view store customer profiles"
  on public.profiles for select
  using (
    get_my_role() = 'admin'
    and exists (
      select 1
      from public.stores s
      join public.applications a on a.store_id = s.id and a.user_id = profiles.id
      where s.admin_id = auth.uid()
    )
  );

-- Super admins: view all profiles
create policy "Super admins view all profiles"
  on public.profiles for select
  using (get_my_role() = 'super_admin');

-- Super admins: update any profile (e.g. assign roles)
create policy "Super admins update any profile"
  on public.profiles for update
  using (get_my_role() = 'super_admin');

-- ────────────────────────────────────────────────────────────
-- Re-create stores policies without recursion
-- ────────────────────────────────────────────────────────────
drop policy if exists "Super admin full access on stores" on public.stores;

create policy "Super admin full access on stores"
  on public.stores for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

-- ────────────────────────────────────────────────────────────
-- Re-create applications policies without recursion
-- ────────────────────────────────────────────────────────────
drop policy if exists "Admins view store applications"        on public.applications;
drop policy if exists "Admins update store applications"      on public.applications;
drop policy if exists "Super admins full access on applications" on public.applications;

create policy "Admins view store applications"
  on public.applications for select
  using (
    get_my_role() = 'admin'
    and exists (
      select 1 from public.stores s
      where s.admin_id = auth.uid() and s.id = applications.store_id
    )
  );

create policy "Admins update store applications"
  on public.applications for update
  using (
    get_my_role() = 'admin'
    and exists (
      select 1 from public.stores s
      where s.admin_id = auth.uid() and s.id = applications.store_id
    )
  );

create policy "Super admins full access on applications"
  on public.applications for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');
