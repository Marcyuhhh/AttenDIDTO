create table if not exists public.attendance_scan_windows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  primary key (user_id, event_id)
);

alter table public.attendance_scan_windows enable row level security;
revoke all on public.attendance_scan_windows from public, anon, authenticated;

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
    where id = target_event_id and host_user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Only the event host may scan for an approved active event';
  end if;

  insert into public.attendance_scan_windows as scan_window (
    user_id, event_id, window_started_at, attempt_count
  ) values (
    auth.uid(), target_event_id, now(), 1
  )
  on conflict (user_id, event_id) do update
  set window_started_at = case
        when scan_window.window_started_at <= now() - interval '1 minute'
          then now()
        else scan_window.window_started_at
      end,
      attempt_count = case
        when scan_window.window_started_at <= now() - interval '1 minute'
          then 1
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

revoke all on function public.record_attendance_by_qr(uuid, text, text) from public, anon;
grant execute on function public.record_attendance_by_qr(uuid, text, text) to authenticated;
