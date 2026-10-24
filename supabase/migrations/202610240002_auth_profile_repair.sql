create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user auth.users;
  ensured_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into auth_user from auth.users where id = auth.uid();
  if auth_user.id is null then
    raise exception 'Authenticated account was not found';
  end if;

  insert into public.profiles (
    id, full_name, school, email, year_level, department, course, qr_pass_code
  ) values (
    auth_user.id,
    coalesce(nullif(trim(auth_user.raw_user_meta_data->>'full_name'), ''), split_part(auth_user.email, '@', 1)),
    coalesce(nullif(trim(auth_user.raw_user_meta_data->>'school'), ''), 'USTP Cagayan de Oro'),
    auth_user.email,
    coalesce(nullif(auth_user.raw_user_meta_data->>'year_level', ''), '1st Year'),
    coalesce(nullif(trim(auth_user.raw_user_meta_data->>'department'), ''), 'General Department'),
    coalesce(nullif(trim(auth_user.raw_user_meta_data->>'course'), ''), 'Undeclared'),
    'AID-PASS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  )
  on conflict (id) do update set
    email = excluded.email
  returning * into ensured_profile;

  return ensured_profile;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;