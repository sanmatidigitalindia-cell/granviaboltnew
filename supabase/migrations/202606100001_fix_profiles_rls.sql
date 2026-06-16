-- Fix profiles RLS policies.
-- Previous attempt used a self-referencing subquery on profiles which caused
-- "infinite recursion detected in policy for relation profiles".
-- Fix: use a SECURITY DEFINER function that reads profiles bypassing RLS.

-- Helper: reads the current user's role without triggering RLS (security definer bypasses it)
create or replace function public.get_my_claim_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Drop old recursive policies
drop policy if exists "profiles_select_own_or_admin"  on public.profiles;
drop policy if exists "profiles_insert_own_or_admin"  on public.profiles;
drop policy if exists "profiles_update_own_or_admin"  on public.profiles;
drop policy if exists "profiles_delete_own_or_admin"  on public.profiles;

-- SELECT: own row or super_admin
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    id = auth.uid()
    or public.get_my_claim_role() = 'super_admin'
  );

-- INSERT: own row (new user bootstrap) or super_admin
create policy "profiles_insert_own_or_admin" on public.profiles
  for insert with check (
    id = auth.uid()
    or public.get_my_claim_role() = 'super_admin'
  );

-- UPDATE: own row or super_admin
create policy "profiles_update_own_or_admin" on public.profiles
  for update
  using (
    id = auth.uid()
    or public.get_my_claim_role() = 'super_admin'
  )
  with check (
    id = auth.uid()
    or public.get_my_claim_role() = 'super_admin'
  );
