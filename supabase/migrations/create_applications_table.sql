-- ============================================================
-- HTB Global: Loan Applications Table
-- Run this once in the Supabase SQL Editor
-- ============================================================

create table if not exists public.applications (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  reference     text not null,
  status        text not null default 'submitted',
  created_at    timestamptz default now(),

  -- Store & Lookup
  store_id      int,
  store_name    text,
  national_id   text,

  -- Purchase Details
  product_name   text,
  retail_price   numeric(12,2),
  deposit_amount numeric(12,2),
  balance_amount numeric(12,2),

  -- Basic Info
  first_name     text,
  last_name      text,
  date_of_birth  text,
  gender         text,
  photo_url      text,

  -- Contact Details
  physical_address text,
  mobile_number    text,
  email_address    text,

  -- Employment Details
  employer_name    text,
  is_civil_servant boolean,
  employer_no      text,
  ministry         text,
  employer_phone   text,
  employer_contact_person text,
  employer_email   text,
  employer_address text,

  -- Next of Kin
  kin_full_name    text,
  kin_relationship text,
  kin_mobile       text,
  kin_address      text
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Policy: users can only see their own applications
create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

-- Policy: authenticated users can insert their own applications
create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

-- Policy: users can update their own applications
create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);
