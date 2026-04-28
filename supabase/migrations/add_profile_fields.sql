-- ============================================================
-- HTB Global: Complete User Profile
-- All user data in ONE table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- BASIC INFO
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists national_id text;
alter table public.profiles add column if not exists date_of_birth text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists photo_url text;

-- CONTACT
alter table public.profiles add column if not exists physical_address text;
alter table public.profiles add column if not exists mobile_number text;
alter table public.profiles add column if not exists email_address text;

-- NEXT OF KIN
alter table public.profiles add column if not exists nok_full_name text;
alter table public.profiles add column if not exists nok_address text;
alter table public.profiles add column if not exists nok_mobile_number text;
alter table public.profiles add column if not exists nok_relationship text;

-- EMPLOYMENT
alter table public.profiles add column if not exists employer_name text;
alter table public.profiles add column if not exists employer_no text;
alter table public.profiles add column if not exists ministry text;
alter table public.profiles add column if not exists is_civil_servant boolean default false;
alter table public.profiles add column if not exists monthly_income text;
alter table public.profiles add column if not exists employment_phone text;

-- STATUS
alter table public.profiles add column if not exists is_profile_complete boolean default false;

-- Index
create index if not exists idx_profiles_national_id on public.profiles(national_id) where national_id is not null;