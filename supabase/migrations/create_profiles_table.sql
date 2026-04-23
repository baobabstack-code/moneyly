-- ============================================================
-- HTB Global: User Profiles Table
-- Run this FIRST (before create_applications_table.sql)
-- in the Supabase SQL Editor
-- ============================================================

create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  username    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policy: users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- Auto-sync trigger: Copies OAuth user metadata (Google name,
-- avatar etc.) into the profiles table on first sign-up.
-- This ensures profile data is always available even if the
-- user signed up via Google and never manually set a profile.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
