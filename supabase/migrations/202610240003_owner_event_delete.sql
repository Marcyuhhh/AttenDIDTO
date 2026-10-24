drop policy if exists events_delete_owner on public.events;
create policy events_delete_owner on public.events
  for delete to authenticated
  using (host_user_id = auth.uid() and not public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() and role = 'student')
  with check (id = auth.uid() and role = 'student');

revoke update on public.profiles from authenticated;
grant update (full_name, school, year_level, department, course, profile_picture_url)
  on public.profiles to authenticated;