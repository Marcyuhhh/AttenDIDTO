alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.profiles
set first_name = coalesce(nullif(trim(first_name), ''), split_part(trim(full_name), ' ', 1)),
    last_name = coalesce(
      nullif(trim(last_name), ''),
      nullif(trim(substr(trim(full_name), length(split_part(trim(full_name), ' ', 1)) + 1)), ''),
      ''
    );

alter table public.profiles
  alter column first_name set default '',
  alter column first_name set not null,
  alter column last_name set default '',
  alter column last_name set not null;

create or replace function public.sync_profile_name_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  original_full_name text;
begin
  original_full_name := nullif(trim(new.full_name), '');

  if tg_op = 'INSERT' then
    if nullif(trim(new.first_name), '') is null then
      new.first_name := split_part(coalesce(original_full_name, ''), ' ', 1);
    end if;
    if nullif(trim(new.last_name), '') is null then
      new.last_name := coalesce(
        nullif(trim(substr(
          coalesce(original_full_name, ''),
          length(split_part(coalesce(original_full_name, ''), ' ', 1)) + 1
        )), ''),
        ''
      );
    end if;
  elsif new.full_name is distinct from old.full_name
      and new.first_name is not distinct from old.first_name
      and new.last_name is not distinct from old.last_name then
    new.first_name := split_part(coalesce(original_full_name, ''), ' ', 1);
    new.last_name := coalesce(
      nullif(trim(substr(
        coalesce(original_full_name, ''),
        length(split_part(coalesce(original_full_name, ''), ' ', 1)) + 1
      )), ''),
      ''
    );
  end if;

  new.first_name := coalesce(nullif(trim(new.first_name), ''), '');
  new.last_name := coalesce(nullif(trim(new.last_name), ''), '');
  new.full_name := coalesce(
    nullif(trim(concat_ws(' ', nullif(new.first_name, ''), nullif(new.last_name, ''))), ''),
    original_full_name,
    'Student'
  );

  return new;
end;
$$;

drop trigger if exists sync_profile_name_fields on public.profiles;
create trigger sync_profile_name_fields
  before insert or update on public.profiles
  for each row execute function public.sync_profile_name_fields();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_first_name text;
  profile_last_name text;
  profile_full_name text;
begin
  profile_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  profile_first_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    split_part(profile_full_name, ' ', 1)
  );
  profile_last_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
    nullif(trim(substr(profile_full_name, length(split_part(profile_full_name, ' ', 1)) + 1)), ''),
    ''
  );

  insert into public.profiles (
    id, first_name, last_name, full_name, school, email, year_level,
    department, course, qr_pass_code
  ) values (
    new.id,
    profile_first_name,
    profile_last_name,
    trim(concat_ws(' ', profile_first_name, profile_last_name)),
    coalesce(nullif(trim(new.raw_user_meta_data->>'school'), ''), 'USTP Cagayan de Oro'),
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'year_level', ''), '1st Year'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'department'), ''), 'General Department'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'course'), ''), 'Undeclared'),
    'AID-PASS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ) on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user auth.users;
  ensured_profile public.profiles;
  profile_first_name text;
  profile_last_name text;
  profile_full_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into auth_user from auth.users where id = auth.uid();
  if auth_user.id is null then
    raise exception 'Authenticated account was not found';
  end if;

  profile_full_name := coalesce(
    nullif(trim(auth_user.raw_user_meta_data->>'full_name'), ''),
    split_part(auth_user.email, '@', 1)
  );
  profile_first_name := coalesce(
    nullif(trim(auth_user.raw_user_meta_data->>'first_name'), ''),
    split_part(profile_full_name, ' ', 1)
  );
  profile_last_name := coalesce(
    nullif(trim(auth_user.raw_user_meta_data->>'last_name'), ''),
    nullif(trim(substr(profile_full_name, length(split_part(profile_full_name, ' ', 1)) + 1)), ''),
    ''
  );

  insert into public.profiles (
    id, first_name, last_name, full_name, school, email, year_level,
    department, course, qr_pass_code
  ) values (
    auth_user.id,
    profile_first_name,
    profile_last_name,
    trim(concat_ws(' ', profile_first_name, profile_last_name)),
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

revoke update on public.profiles from authenticated;
grant update (
  first_name, last_name, full_name, school, year_level, department, course,
  profile_picture_url
) on public.profiles to authenticated;
