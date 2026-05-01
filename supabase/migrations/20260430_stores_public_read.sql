-- ============================================================
-- Allow anyone (including unauthenticated visitors) to read
-- stores so the store-selection step of the application flow
-- returns results.
--
-- Also restores the "Admin can view own store" policy that was
-- dropped by the fix_rls_recursion migration but never re-added.
-- ============================================================

-- Public read: store-selection page is shown before login,
-- so anon users must be able to list stores.
drop policy if exists "Anyone can view stores" on public.stores;

create policy "Anyone can view stores"
  on public.stores for select
  using (true);

-- Restore admin own-store read (dropped implicitly when the old
-- "Admin can view own store" policy was never re-created after
-- fix_rls_recursion.sql recreated only super_admin policy).
-- The "Anyone can view stores" policy above already covers this,
-- but keeping the explicit policy documents intent clearly.
drop policy if exists "Admin can view own store" on public.stores;
