-- Function to look up a profile by national ID, normalizing both sides.
-- Strips dashes, spaces, and upper-cases before comparing so users can
-- enter IDs in any format (e.g. "63-2406892V25", "632406892v25", etc.).
create or replace function find_profile_by_national_id(search_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles
    where upper(regexp_replace(national_id, '[\s\-]', '', 'g'))
        = upper(regexp_replace(search_id,   '[\s\-]', '', 'g'))
  );
$$;
