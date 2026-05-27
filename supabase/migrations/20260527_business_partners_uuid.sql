-- Add uuid column to business_partners for non-enumerable URL slugs
alter table public.business_partners
  add column if not exists uuid uuid not null default gen_random_uuid();

create unique index if not exists idx_business_partners_uuid
  on public.business_partners(uuid);
