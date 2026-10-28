-- Break the circular RLS dependency between events and event_scanners.
-- These helpers run with the function owner's privileges and are only used
-- for boolean authorization checks inside RLS policies.
create or replace function public.is_event_host_or_admin(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.events
      where id = target_event_id
        and host_user_id = auth.uid()
    );
$$;

create or replace function public.is_event_scanner(
  target_event_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_scanners
    where event_id = target_event_id
      and user_id = target_user_id
  );
$$;

revoke all on function public.is_event_host_or_admin(uuid) from public, anon;
revoke all on function public.is_event_scanner(uuid, uuid) from public, anon;
grant execute on function public.is_event_host_or_admin(uuid) to authenticated;
grant execute on function public.is_event_scanner(uuid, uuid) to authenticated;

drop policy if exists event_scanners_read_authorized on public.event_scanners;
create policy event_scanners_read_authorized on public.event_scanners
  for select to authenticated using (
    user_id = auth.uid()
    or public.is_event_host_or_admin(event_id)
  );

drop policy if exists events_read_owner_or_admin on public.events;
create policy events_read_owner_or_admin on public.events
  for select to authenticated using (
    host_user_id = auth.uid()
    or public.is_admin()
    or public.has_attended_event(id)
    or public.is_event_scanner(id)
  );

drop policy if exists attendance_read_participant_host_admin on public.attendance_records;
create policy attendance_read_participant_host_admin on public.attendance_records
  for select to authenticated using (
    participant_id = auth.uid()
    or public.is_admin()
    or public.is_event_host_or_admin(event_id)
    or public.is_event_scanner(event_id)
  );

drop policy if exists profiles_read_own_admin_or_event_attendees on public.profiles;
create policy profiles_read_own_admin_or_event_attendees on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.attendance_records ar
      where ar.participant_id = profiles.id
        and (
          public.is_event_host_or_admin(ar.event_id)
          or public.is_event_scanner(ar.event_id)
        )
    )
  );
