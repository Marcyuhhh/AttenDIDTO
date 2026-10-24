create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists role text not null default 'student';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'admin'));

alter table public.events
  add column if not exists event_code text;

alter table public.events
  add column if not exists payment_reference text;

alter table public.events
  add column if not exists payment_reviewed_at timestamptz;

alter table public.events
  add column if not exists payment_reviewed_by uuid references public.profiles(id);

alter table public.events
  drop constraint if exists events_status_check;

alter table public.events
  add constraint events_status_check check (status in ('pending_payment', 'active', 'completed', 'canceled', 'archived'));

alter table public.events
  drop constraint if exists events_payment_status_check;

alter table public.events
  add constraint events_payment_status_check check (payment_status in ('pending', 'paid', 'rejected', 'canceled', 'unpaid', 'exempted'));

update public.events
set status = 'pending_payment',
    payment_status = 'pending',
    payment_reference = coalesce(payment_reference, 'LEGACY-REVIEW-REQUIRED')
where status = 'active' and payment_status = 'paid' and payment_reviewed_at is null;

update public.events
set event_code = 'EVT-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where event_code is null;

alter table public.events
  alter column event_code set default ('EVT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));

alter table public.events
  alter column event_code set not null;

create unique index if not exists events_event_code_uidx on public.events(event_code);

create table if not exists public.sign_in_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  signed_in_at timestamptz not null default now()
);

create index if not exists sign_in_logs_signed_in_at_idx on public.sign_in_logs(signed_in_at desc);

create or replace function public.log_auth_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    insert into public.sign_in_logs(user_id, signed_in_at)
    values (new.id, new.last_sign_in_at);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_sign_in_log on auth.users;
create trigger on_auth_user_sign_in_log
  after update of last_sign_in_at on auth.users
  for each row execute procedure public.log_auth_sign_in();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_attended_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.attendance_records
    where event_id = target_event_id and participant_id = auth.uid()
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, school, email, year_level, department, course, qr_pass_code
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'school', 'USTP Cagayan de Oro'),
    new.email,
    coalesce(new.raw_user_meta_data->>'year_level', '1st Year'),
    coalesce(new.raw_user_meta_data->>'department', 'General Department'),
    coalesce(new.raw_user_meta_data->>'course', 'Undeclared'),
    'AID-PASS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.create_event_request(
  event_data jsonb,
  submitted_payment_reference text
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  created_event public.events;
  recent_request_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(submitted_payment_reference), '') is null then
    raise exception 'Payment reference is required';
  end if;

  select count(*) into recent_request_count
  from public.events
  where host_user_id = auth.uid() and created_at > now() - interval '10 minutes';
  if recent_request_count >= 5 then
    raise exception 'Too many event requests. Please wait before submitting another.';
  end if;

  insert into public.events (
    host_user_id, organization_name, title, description, venue, event_date,
    start_time, end_time, target_attendees, requires_time_out, status,
    payment_status, payment_method, payment_reference, payment_amount
  ) values (
    auth.uid(), event_data->>'organization_name', event_data->>'title',
    event_data->>'description', event_data->>'venue',
    (event_data->>'event_date')::date, (event_data->>'start_time')::time,
    (event_data->>'end_time')::time,
    greatest(1, least(5000, coalesce((event_data->>'target_attendees')::integer, 100))),
    coalesce((event_data->>'requires_time_out')::boolean, false),
    'pending_payment', 'pending', event_data->>'payment_method',
    trim(submitted_payment_reference), 49.00
  ) returning * into created_event;

  return created_event;
end;
$$;

create or replace function public.review_event_payment(event_id uuid, decision text)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_event public.events;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if decision not in ('approve', 'cancel') then
    raise exception 'Decision must be approve or cancel';
  end if;

  update public.events
  set status = case when decision = 'approve' then 'active' else 'canceled' end,
      payment_status = case when decision = 'approve' then 'paid' else 'canceled' end,
      payment_reviewed_at = now(),
      payment_reviewed_by = auth.uid(),
      updated_at = now()
  where id = event_id and status = 'pending_payment'
  returning * into reviewed_event;

  if reviewed_event.id is null then
    raise exception 'Pending event not found';
  end if;
  return reviewed_event;
end;
$$;

create or replace function public.record_attendance_by_qr(
  target_event_id uuid,
  participant_qr text,
  scanner_device_name text default 'Web Camera'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_profile public.profiles;
  new_record public.attendance_records;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into participant_profile
  from public.profiles
  where upper(qr_pass_code) = upper(trim(participant_qr));

  if participant_profile.id is null then
    raise exception 'Participant QR code not found';
  end if;

  if not exists (
    select 1 from public.events
    where id = target_event_id and host_user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Only the event host may scan for an approved active event';
  end if;

  insert into public.attendance_records(event_id, participant_id, scanned_by_user_id, scanner_device)
  values (target_event_id, participant_profile.id, auth.uid(), scanner_device_name)
  on conflict (event_id, participant_id) do nothing
  returning * into new_record;

  if new_record.id is null then
    raise exception 'Participant already checked in';
  end if;
  return jsonb_build_object(
    'record', to_jsonb(new_record),
    'participant', jsonb_build_object(
      'id', participant_profile.id,
      'full_name', participant_profile.full_name,
      'school', participant_profile.school,
      'department', participant_profile.department,
      'course', participant_profile.course,
      'year_level', participant_profile.year_level
    )
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance_records enable row level security;
alter table public.sign_in_logs enable row level security;

drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists profiles_read_own_or_admin on public.profiles;
drop policy if exists profiles_read_own_admin_or_event_attendees on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_read_own_admin_or_event_attendees on public.profiles
  for select to authenticated using (
    id = auth.uid() or public.is_admin() or exists (
      select 1
      from public.attendance_records ar
      join public.events e on e.id = ar.event_id
      where ar.participant_id = profiles.id and e.host_user_id = auth.uid()
    )
  );
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = 'student');

revoke update on public.profiles from authenticated;
grant update (full_name, school, year_level, department, course, profile_picture_url)
  on public.profiles to authenticated;

drop policy if exists "Active events viewable by authenticated users" on public.events;
drop policy if exists "Users can create events" on public.events;
drop policy if exists "Host can update their own event" on public.events;
drop policy if exists events_read_owner_or_admin on public.events;
drop policy if exists events_insert_pending_owner on public.events;
create policy events_read_owner_or_admin on public.events
  for select to authenticated using (
    host_user_id = auth.uid() or public.is_admin() or public.has_attended_event(id)
  );

drop policy if exists "Attendance viewable by authenticated users" on public.attendance_records;
drop policy if exists "Authenticated users can record attendance" on public.attendance_records;
drop policy if exists attendance_read_participant_host_admin on public.attendance_records;
create policy attendance_read_participant_host_admin on public.attendance_records
  for select to authenticated using (
    participant_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.events e where e.id = event_id and e.host_user_id = auth.uid()
    )
  );

drop policy if exists sign_in_logs_read_admin on public.sign_in_logs;
create policy sign_in_logs_read_admin on public.sign_in_logs
  for select to authenticated using (public.is_admin());

revoke all on function public.review_event_payment(uuid, text) from public, anon;
revoke all on function public.create_event_request(jsonb, text) from public, anon;
revoke all on function public.record_attendance_by_qr(uuid, text, text) from public, anon;
grant execute on function public.review_event_payment(uuid, text) to authenticated;
grant execute on function public.create_event_request(jsonb, text) to authenticated;
grant execute on function public.record_attendance_by_qr(uuid, text, text) to authenticated;

comment on column public.events.event_code is 'Public human-readable event identifier; UUID remains the primary key.';
comment on table public.sign_in_logs is 'Successful sign-ins recorded by the application after Supabase Auth succeeds.';