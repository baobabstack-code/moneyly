-- Add document columns to applications table
alter table public.applications 
add column if not exists id_copy_url text,
add column if not exists payslip_url text;

-- Create Storage Bucket for Applications if it doesn't exist
-- Note: Some environments might require manual bucket creation if storage schema isn't accessible via DDL
insert into storage.buckets (id, name, public)
values ('applications', 'applications', true)
on conflict (id) do nothing;

-- Set up storage policies for the 'applications' bucket
create policy "Public Access to Applications"
on storage.objects for select
using ( bucket_id = 'applications' );

create policy "Authenticated Users can upload to Applications"
on storage.objects for insert
with check ( bucket_id = 'applications' AND auth.role() = 'authenticated' );

create policy "Users can update their own uploads"
on storage.objects for update
using ( bucket_id = 'applications' AND auth.uid() = owner );
