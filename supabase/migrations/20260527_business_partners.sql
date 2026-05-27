-- ============================================================
-- Business Partners Migration
-- Renames 'stores' table to 'business_partners' and adds
-- partner_type (store | funder), funder_type, contact_email.
-- Also adds funder_id to applications.
-- ============================================================

-- 1. Rename the table
alter table public.stores rename to business_partners;

-- 2. Drop old index (will recreate with new name)
drop index if exists public.idx_stores_admin_id;

-- 3. Add partner_type column; default 'store' for existing rows
alter table public.business_partners
  add column if not exists partner_type text not null default 'store'
    check (partner_type in ('store', 'funder'));

-- Backfill existing rows
update public.business_partners set partner_type = 'store';

-- 4. Add funder-specific fields
alter table public.business_partners
  add column if not exists funder_type   text,
  add column if not exists contact_email text;

-- 5. Add funder_id to applications
alter table public.applications
  add column if not exists funder_id int references public.business_partners(id) on delete set null;

-- 6. Recreate indexes
create index if not exists idx_business_partners_partner_type on public.business_partners(partner_type);
create index if not exists idx_business_partners_admin_id     on public.business_partners(admin_id);
create index if not exists idx_applications_funder_id         on public.applications(funder_id);

-- 7. Update RLS policies (old names still exist on the renamed table)
drop policy if exists "Anyone can view stores"            on public.business_partners;
drop policy if exists "Super admin full access on stores" on public.business_partners;

create policy "Anyone can view business_partners"
  on public.business_partners for select
  using (true);

create policy "Super admin full access on business_partners"
  on public.business_partners for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');
