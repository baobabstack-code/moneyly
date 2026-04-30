-- Add richer employer contact details to profiles and applications.

alter table public.profiles
  add column if not exists employer_contact_person text,
  add column if not exists employer_email text,
  add column if not exists employer_address text;

alter table public.applications
  add column if not exists employer_contact_person text,
  add column if not exists employer_email text,
  add column if not exists employer_address text;
