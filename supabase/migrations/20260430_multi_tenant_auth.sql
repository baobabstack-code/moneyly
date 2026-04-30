-- ============================================================
-- HTB Global: Multi-Tenant Auth — Stores, Roles, RLS
-- Run in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add role column to profiles
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'admin', 'super_admin'));

-- ────────────────────────────────────────────────────────────
-- 2. Stores table
-- ────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id         serial primary key,
  name       text not null,
  admin_id   uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.stores enable row level security;

create policy "Super admin full access on stores"
  on public.stores for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

create policy "Admin can view own store"
  on public.stores for select
  using (admin_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 3. Update handle_new_user to read role from invite metadata
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 4. Update RLS on profiles
-- ────────────────────────────────────────────────────────────
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

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
create policy "Admins view store customer profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.profiles me
      join public.stores s on s.admin_id = me.id
      join public.applications a on a.store_id = s.id and a.user_id = profiles.id
      where me.id = auth.uid() and me.role = 'admin'
    )
  );

-- Super admins: view all profiles
create policy "Super admins view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Super admins: update any profile (e.g. assign roles)
create policy "Super admins update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- ────────────────────────────────────────────────────────────
-- 5. Update RLS on applications
-- ────────────────────────────────────────────────────────────
drop policy if exists "Users can view own applications" on public.applications;
drop policy if exists "Users can insert own applications" on public.applications;
drop policy if exists "Users can update own applications" on public.applications;

-- Customers: own applications only
create policy "Customers view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Customers insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Customers update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

-- Admins: applications for their store
create policy "Admins view store applications"
  on public.applications for select
  using (
    exists (
      select 1
      from public.stores s
      join public.profiles p on p.id = s.admin_id
      where p.id = auth.uid() and p.role = 'admin' and s.id = applications.store_id
    )
  );

create policy "Admins update store applications"
  on public.applications for update
  using (
    exists (
      select 1
      from public.stores s
      join public.profiles p on p.id = s.admin_id
      where p.id = auth.uid() and p.role = 'admin' and s.id = applications.store_id
    )
  );

-- Super admins: full access on applications
create policy "Super admins full access on applications"
  on public.applications for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Index for store-based lookups
create index if not exists idx_applications_store_id on public.applications(store_id);
create index if not exists idx_stores_admin_id on public.stores(admin_id);
create index if not exists idx_profiles_role on public.profiles(role);
