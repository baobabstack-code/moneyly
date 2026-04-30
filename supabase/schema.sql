-- ============================================================
-- HTB GLOBAL — Complete Database Schema
-- Run this in a fresh Supabase project SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  full_name           text,
  avatar_url          text,
  username            text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  -- Basic Info
  first_name          text,
  last_name           text,
  national_id         text,
  date_of_birth       text,
  gender              text,
  photo_url           text,

  -- Contact
  physical_address    text,
  mobile_number       text,
  email_address       text,

  -- Next of Kin
  nok_full_name       text,
  nok_address         text,
  nok_mobile_number   text,
  nok_relationship    text,

  -- Employment
  employer_name       text,
  employer_no         text,
  ministry            text,
  is_civil_servant    boolean default false,
  monthly_income      text,
  employment_phone    text,
  employer_contact_person text,
  employer_email      text,
  employer_address    text,

  -- Status
  is_profile_complete boolean default false,

  -- Multi-tenant role: 'customer' | 'admin' | 'super_admin'
  role text not null default 'customer' check (role in ('customer', 'admin', 'super_admin'))
);

alter table public.profiles enable row level security;

-- Customers: own row only
create policy "Customers view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Customers insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Customers update own profile"
  on public.profiles for update using (auth.uid() = id);

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

-- Super admins: full access
create policy "Super admins view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));
create policy "Super admins update any profile"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));

-- Auto-create profile row on signup (reads role from invite metadata)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Faster national ID lookups
create index if not exists idx_profiles_national_id
  on public.profiles(national_id) where national_id is not null;

-- Normalised national ID lookup function (strips dashes/spaces, case-insensitive)
create or replace function find_profile_by_national_id(search_id text)
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where upper(regexp_replace(national_id, '[\s\-]', '', 'g'))
        = upper(regexp_replace(search_id,   '[\s\-]', '', 'g'))
  );
$$;


-- ────────────────────────────────────────────────────────────
-- 2. APPLICATIONS
-- ────────────────────────────────────────────────────────────
create table if not exists public.applications (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade,
  reference         text not null,
  status            text not null default 'submitted',
  created_at        timestamptz default now(),

  -- Store
  store_id          int,
  store_name        text,
  national_id       text,

  -- Purchase
  product_name      text,
  retail_price      numeric(12,2),
  deposit_amount    numeric(12,2),
  balance_amount    numeric(12,2),
  tenure_months     integer,

  -- Personal
  first_name        text,
  last_name         text,
  date_of_birth     text,
  gender            text,
  photo_url         text,

  -- Contact
  physical_address  text,
  mobile_number     text,
  email_address     text,

  -- Employment
  employer_name     text,
  is_civil_servant  boolean,
  employer_no       text,
  ministry          text,
  employer_phone    text,
  employer_contact_person text,
  employer_email    text,
  employer_address  text,

  -- Next of Kin
  kin_full_name     text,
  kin_relationship  text,
  kin_mobile        text,
  kin_address       text,

  -- Documents
  id_copy_url       text,
  payslip_url       text
);

alter table public.applications enable row level security;

-- Customers: own applications only
create policy "Customers view own applications"
  on public.applications for select using (auth.uid() = user_id);
create policy "Customers insert own applications"
  on public.applications for insert with check (auth.uid() = user_id);
create policy "Customers update own applications"
  on public.applications for update using (auth.uid() = user_id);

-- Admins: applications for their store
create policy "Admins view store applications"
  on public.applications for select
  using (
    exists (
      select 1 from public.stores s
      join public.profiles p on p.id = s.admin_id
      where p.id = auth.uid() and p.role = 'admin' and s.id = applications.store_id
    )
  );
create policy "Admins update store applications"
  on public.applications for update
  using (
    exists (
      select 1 from public.stores s
      join public.profiles p on p.id = s.admin_id
      where p.id = auth.uid() and p.role = 'admin' and s.id = applications.store_id
    )
  );

-- Super admins: full access
create policy "Super admins full access on applications"
  on public.applications for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));

-- Indexes
create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_store_id on public.applications(store_id);


-- ────────────────────────────────────────────────────────────
-- 3. STORES
-- ────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id         serial primary key,
  name       text not null,
  code       text,
  location   text,
  hours      text,
  logo_url   text,
  admin_id   uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.stores enable row level security;

create policy "Super admin full access on stores"
  on public.stores for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));

create policy "Admin can view own store"
  on public.stores for select
  using (admin_id = auth.uid());

create index if not exists idx_stores_admin_id on public.stores(admin_id);
create index if not exists idx_profiles_role on public.profiles(role);


-- ────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────

-- Avatars (profile photos)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Authenticated upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- Application documents (ID copies, payslips)
insert into storage.buckets (id, name, public)
values ('applications', 'applications', true)
on conflict (id) do nothing;

create policy "Public read application docs"
  on storage.objects for select using (bucket_id = 'applications');
create policy "Authenticated upload application docs"
  on storage.objects for insert
  with check (bucket_id = 'applications' and auth.role() = 'authenticated');
create policy "Users update own application docs"
  on storage.objects for update
  using (bucket_id = 'applications' and auth.uid() = owner);
