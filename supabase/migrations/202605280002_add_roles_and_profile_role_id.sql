alter table public.profiles
  add column if not exists role_id uuid;

update public.profiles p
set role_id = r.id
from public.roles r
where p.role = r.key
  and p.role_id is distinct from r.id;

alter table public.profiles
  alter column role_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_id_fkey foreign key (role_id) references public.roles(id);
  end if;
end $$;
