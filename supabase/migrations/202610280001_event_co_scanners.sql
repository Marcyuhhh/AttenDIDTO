alter table public.event_scanners enable row level security;

drop policy if exists event_scanners_read_authorized on public.event_scanners;
create policy event_scanners_read_authorized on public.event_scanners
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events
      where id = event_id and (host_user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists events_read_owner_or_admin on public.events;
create policy events_read_owner_or_admin on public.events
  for select to authenticated using (
    host_user_id = auth.uid()
    or public.is_admin()
    or public.has_attended_event(id)
    or exists (
      select 1 from public.event_scanners
      where event_id = id and user_id = auth.uid()
    )
  );

create or replace function public.get_event_scanners(target_event_id uuid)
returns table (
  id uuid,
  user_id uuid,
  assigned_label text,
  created_at timestamptz,
  full_name text,
  email text,
  school text,
  qr_pass_code text
)
language sql
security definer
set search_path = public
as $$
  select es.id, es.user_id, es.assigned_label, es.created_at,
         p.full_name, p.email, p.school, p.qr_pass_code
  from public.event_scanners es
  join public.events e on e.id = es.event_id
  join public.profiles p on p.id = es.user_id
  where es.event_id = target_event_id
    and (e.host_user_id = auth.uid() or public.is_admin());
$$;

create or replace function public.add_event_scanner(
  target_event_id uuid,
  scanner_qr text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_host uuid;
  scanner_profile public.profiles;
  scanner_record public.event_scanners;
begin
  select host_user_id into event_host
  from public.events
  where id = target_event_id and status = 'active';

  if event_host is null or event_host <> auth.uid() then
    raise exception 'Only the event host may manage co-scanners';
  end if;

  if scanner_qr is null or length(trim(scanner_qr)) = 0 or length(trim(scanner_qr)) > 64 then
    raise exception 'Enter a valid co-scanner code';
  end if;

  select * into scanner_profile
  from public.profiles
  where upper(qr_pass_code) = upper(trim(scanner_qr));

  if scanner_profile.id is null then
    raise exception 'No account was found for that co-scanner code';
  end if;

  if scanner_profile.id = auth.uid() then
    raise exception 'The event creator is already the main scanner';
  end if;

  insert into public.event_scanners(event_id, user_id)
  values (target_event_id, scanner_profile.id)
  on conflict (event_id, user_id) do update
    set assigned_label = excluded.assigned_label
  returning * into scanner_record;

  return jsonb_build_object(
    'id', scanner_record.id,
    'user_id', scanner_profile.id,
    'assigned_label', scanner_record.assigned_label,
    'created_at', scanner_record.created_at,
    'full_name', scanner_profile.full_name,
    'email', scanner_profile.email,
    'school', scanner_profile.school,
    'qr_pass_code', scanner_profile.qr_pass_code
  );
end;
$$;

create or replace function public.remove_event_scanner(
  target_event_id uuid,
  target_scanner_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.events
    where id = target_event_id and host_user_id = auth.uid()
  ) then
    raise exception 'Only the event host may manage co-scanners';
  end if;

  delete from public.event_scanners
  where event_id = target_event_id and user_id = target_scanner_user_id;

  return found;
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
  existing_record public.attendance_records;
  current_attempt_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.events
    where id = target_event_id
      and status = 'active'
      and (host_user_id = auth.uid() or exists (
        select 1 from public.event_scanners
        where event_id = target_event_id and user_id = auth.uid()
      ))
  ) then
    raise exception 'Only an assigned scanner may scan for an approved active event';
  end if;

  insert into public.attendance_scan_windows as scan_window (
    user_id, event_id, window_started_at, attempt_count
  ) values (auth.uid(), target_event_id, now(), 1)
  on conflict (user_id, event_id) do update
  set window_started_at = case
        when scan_window.window_started_at <= now() - interval '1 minute' then now()
        else scan_window.window_started_at
      end,
      attempt_count = case
        when scan_window.window_started_at <= now() - interval '1 minute' then 1
        else scan_window.attempt_count + 1
      end
  returning attempt_count into current_attempt_count;

  if current_attempt_count > 30 then
    return jsonb_build_object(
      'success', false,
      'isDuplicate', false,
      'message', 'Too many scan attempts. Please wait a minute and try again.'
    );
  end if;

  if participant_qr is null
    or length(trim(participant_qr)) = 0
    or length(trim(participant_qr)) > 64 then
    return jsonb_build_object(
      'success', false,
      'isDuplicate', false,
      'message', 'QR code could not be verified'
    );
  end if;

  select * into participant_profile
  from public.profiles
  where upper(qr_pass_code) = upper(trim(participant_qr));

  if participant_profile.id is null then
    return jsonb_build_object(
      'success', false,
      'isDuplicate', false,
      'message', 'QR code could not be verified'
    );
  end if;

  insert into public.attendance_records(event_id, participant_id, scanned_by_user_id, scanner_device)
  values (target_event_id, participant_profile.id, auth.uid(), scanner_device_name)
  on conflict (event_id, participant_id) do nothing
  returning * into new_record;

  if new_record.id is null then
    select * into existing_record
    from public.attendance_records
    where event_id = target_event_id and participant_id = participant_profile.id;

    return jsonb_build_object(
      'success', false,
      'isDuplicate', true,
      'message', 'Participant already checked in',
      'record', to_jsonb(existing_record)
    );
  end if;

  return jsonb_build_object(
    'success', true,
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

drop policy if exists attendance_read_participant_host_admin on public.attendance_records;
create policy attendance_read_participant_host_admin on public.attendance_records
  for select to authenticated using (
    participant_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.host_user_id = auth.uid() or exists (
          select 1 from public.event_scanners es
          where es.event_id = e.id and es.user_id = auth.uid()
        ))
    )
  );

drop policy if exists profiles_read_own_admin_or_event_attendees on public.profiles;
create policy profiles_read_own_admin_or_event_attendees on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.attendance_records ar
      join public.events e on e.id = ar.event_id
      where ar.participant_id = profiles.id
        and (e.host_user_id = auth.uid() or exists (
          select 1 from public.event_scanners es
          where es.event_id = e.id and es.user_id = auth.uid()
        ))
    )
  );

revoke all on function public.get_event_scanners(uuid) from public, anon;
revoke all on function public.add_event_scanner(uuid, text) from public, anon;
revoke all on function public.remove_event_scanner(uuid, uuid) from public, anon;
revoke all on function public.record_attendance_by_qr(uuid, text, text) from public, anon;
grant execute on function public.get_event_scanners(uuid) to authenticated;
grant execute on function public.add_event_scanner(uuid, text) to authenticated;
grant execute on function public.remove_event_scanner(uuid, uuid) to authenticated;
grant execute on function public.record_attendance_by_qr(uuid, text, text) to authenticated;
