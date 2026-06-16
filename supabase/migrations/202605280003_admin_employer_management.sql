alter table public.employer_profiles
add column if not exists designation text,
add column if not exists profile_status text not null default 'incomplete',
add column if not exists verification_status text not null default 'pending',
add column if not exists admin_remarks text,
add column if not exists rejection_reason text;

alter table public.employer_companies
add column if not exists admin_remarks text,
add column if not exists rejection_reason text;

alter table public.company_documents
add column if not exists rejection_reason text,
add column if not exists file_size bigint,
add column if not exists file_type text;

create or replace function public.admin_delete_employer(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can delete employers.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'employer'
  ) then
    raise exception 'Employer not found.';
  end if;

  delete from auth.users
  where id = target_user_id;
end;
$$;
