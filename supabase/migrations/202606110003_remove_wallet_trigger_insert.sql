-- Remove wallet-system side effects from the auth-user trigger.
-- This avoids any future employer-signup path from referencing dropped wallet tables.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := coalesce(new.raw_user_meta_data->>'role', 'guard');

  insert into public.profiles (id, role, full_name, mobile, email, email_verified)
  values (
    new.id,
    selected_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile',
    new.email,
    new.email_confirmed_at is not null
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  if selected_role = 'employer' then
    insert into public.employer_profiles (
      user_id,
      contact_person_name,
      city,
      state,
      pincode,
      created_from,
      created_by
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'contact_person_name', new.raw_user_meta_data->>'full_name'),
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state',
      new.raw_user_meta_data->>'pincode',
      coalesce(new.raw_user_meta_data->>'created_from', 'app'),
      nullif(new.raw_user_meta_data->>'created_by', '')::uuid
    )
    on conflict (user_id) do nothing;

    if coalesce(new.raw_user_meta_data->>'company_name', '') <> '' then
      insert into public.employer_companies (
        employer_user_id,
        company_name,
        business_type,
        registered_address,
        billing_address,
        gst_number,
        pan_number,
        website,
        company_email,
        company_phone,
        city,
        state,
        pincode,
        verification_status,
        account_status
      )
      values (
        new.id,
        new.raw_user_meta_data->>'company_name',
        new.raw_user_meta_data->>'business_type',
        new.raw_user_meta_data->>'company_address',
        new.raw_user_meta_data->>'company_address',
        new.raw_user_meta_data->>'gst_number',
        new.raw_user_meta_data->>'pan_number',
        new.raw_user_meta_data->>'website',
        new.email,
        new.raw_user_meta_data->>'mobile',
        new.raw_user_meta_data->>'city',
        new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'pincode',
        'pending',
        'active'
      );
    end if;
  end if;

  if selected_role = 'guard' then
    insert into public.guard_profiles (user_id, full_name, mobile, city, state)
    values (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'mobile',
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
