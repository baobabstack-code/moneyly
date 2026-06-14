-- ============================================================
-- Moneyly: Multi-Tenant Auth — Stores, Roles, RLS
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
  code       text,                -- short store code shown on the selection screen (e.g. TVS-001)
  location   text,                -- display address shown to customers
  hours      text,                -- opening hours display string
  logo_url   text,                -- logo image URL for the store selection tile
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

-- ────────────────────────────────────────────────────────────
-- 6. Seed stores (matches the hardcoded list in store-selection/page.tsx)
--    IDs are fixed so existing applications with store_id 1/2/3 keep working.
--    on conflict = safe to re-run.
-- ────────────────────────────────────────────────────────────
insert into public.stores (id, name, code, location, hours, logo_url)
values
  (
    1,
    'TV Sales & Home',
    'TVS-001',
    'Sam Levy''s Village, Borrowdale' || chr(10) || 'Harare, Zimbabwe',
    '8:00 AM - 6:00 PM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBuj7691Ri2bQuVhoJGqt6DQ2yQFO5Pa-SziT1TN6DKpS9t_-6GjGmXKZflPL2rlVt3TIev6Y3X4X1P2kypI_JGnraQfqFyaqo8EwLiG4EEo66rM13bZKFQRJY1TXMmASmPULRgI68XgbyFXQrEPD7PxrSFoI3pdFsw3l18NEaubuP61-HCLaXonIlPWT2oplGPgOZkY-TswFqEkC7y3mi8lyRF0Ur6lVPc3M12hDaH_rcFi4WxjLJLUuraA71OXE642lc1HsuSVBI9'
  ),
  (
    2,
    'Halsted Builders Express',
    'HBE-002',
    '71 Plumtree Road, Belmont' || chr(10) || 'Bulawayo, Zimbabwe',
    '9:00 AM - 5:00 PM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD_QvEJy5HhE7WTgXqj--ifTjKXtQrhsNcGLVQluqPJ6uAh2mNICtzSnC1Nghw3SqSXV2ug0bMKB3sKBzTyLWs0UkgDS3b3dgl6G4MrCRXtB7xDAMGy62gcAA5o07ycw5_wVAojfgTupuODYWzTG1L16QucwxdwyE6cr7Jc_k4QRRkm9cv7NGK-9mAaTALvApnfhfal9Fy9UklrsCTNSBM6wQ7mHcujdNpA4BIJwkxhcep6WLyDftc4JCrairsp-2GvJq1CmopmVvOk'
  ),
  (
    3,
    'Electrosales',
    'ELS-003',
    '128 Seke Road, Graniteside' || chr(10) || 'Harare, Zimbabwe',
    '10:00 AM - 9:00 PM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCK3Yp9TX7tOnp6meMSwFoEVD8XT77sLqMXrondkhXJFH9eX63V5V9jxlNRx9FSeS-2j2kWMTBYBPRXvbu4CRt4877PwgrDCcd7uCr0CBUSkAP77XM_TTWbMFQmbo8jg2MTBWuUYNwAgaLYtAM_kYabb7i3vHk0jxzaVGvo7EScX9h8UU94Ue4TPRAsUFfzWuu8uUlJwFyGqq69WsZItSiBUmihb1qEI-otCr1YexZjSNU3gAMLJiU2oYLqTJZo7rRE-Ha1EwTa7Nzb'
  )
on conflict (id) do update set
  name     = excluded.name,
  code     = excluded.code,
  location = excluded.location,
  hours    = excluded.hours,
  logo_url = excluded.logo_url;

-- ────────────────────────────────────────────────────────────
-- Dev seeds — uncomment and run as needed in SQL editor
-- ────────────────────────────────────────────────────────────

-- Promote a user to super_admin:
-- update public.profiles set role = 'super_admin'
-- where id = (select id from auth.users where email = 'nyasha@kiin.global');

-- Promote a user to admin and assign them to a store:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@example.com');
--
-- update public.stores set admin_id = (select id from auth.users where email = 'admin@example.com')
-- where id = 1; -- replace 1 with the target store id
