-- Create Storage Bucket for Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up storage policies for the 'avatars' bucket
create policy "Public Access to Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

create policy "Authenticated Users can upload to Avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

create policy "Users can update their own avatar uploads"
on storage.objects for update
using ( bucket_id = 'avatars' AND auth.uid() = owner );

create policy "Users can delete their own avatar uploads"
on storage.objects for delete
using ( bucket_id = 'avatars' AND auth.uid() = owner );