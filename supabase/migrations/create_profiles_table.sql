-- ============================================================
-- HTB Global: Complete User Profile Table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Create profiles table
create table if not exists public.profiles (
  id                uuid references auth.users(id) on delete cascade primary key,
  full_name         text,
  avatar_url        text,
  username         text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  
  -- BASIC INFO
  first_name       text,
  last_name        text,
  national_id      text,
  date_of_birth   text,
  gender          text,
  photo_url       text,
  
  -- CONTACT
  physical_address text,
  mobile_number   text,
  email_address  text,
  
  -- NEXT OF KIN
  nok_full_name   text,
  nok_address    text,
  nok_mobile_number text,
  nok_relationship text,
  
  -- EMPLOYMENT
  employer_name  text,
  employer_no    text,
  ministry       text,
  is_civil_servant boolean default false,
  monthly_income  text,
  employment_phone text,
  
  -- STATUS
  is_profile_complete boolean default false
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

-- Auto-sync trigger: Creates profile on user signup
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Index for faster lookups
create index if not exists idx_profiles_national_id on public.profiles(national_id) where national_id is not null;