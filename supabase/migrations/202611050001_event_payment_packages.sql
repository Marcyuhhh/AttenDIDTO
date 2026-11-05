create table if not exists public.event_payment_packages (
  id uuid default gen_random_uuid() primary key,
  purchaser_id uuid references public.profiles(id) on delete cascade not null,
  package_size integer not null check (package_size in (1, 2)),
  amount numeric(10, 2) not null check (amount in (300.00, 500.00)),
  events_used integer not null default 0 check (events_used between 0 and package_size),
  events_pending integer not null default 0 check (events_pending between 0 and package_size),
  status varchar(20) not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  payment_method varchar(30) not null default 'GCash',
  payment_reference text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events
  add column if not exists payment_package_id uuid references public.event_payment_packages(id);

alter table public.event_payment_packages enable row level security;

create policy event_payment_packages_read_own_or_admin
  on public.event_payment_packages for select to authenticated
  using (purchaser_id = auth.uid() or public.is_admin());

drop function if exists public.create_event_request(jsonb, text);

create or replace function public.create_event_request(
  event_data jsonb,
  submitted_payment_reference text,
  selected_package_size integer default null,
  existing_package_id uuid default null
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  created_event public.events;
  package_record public.event_payment_packages;
  package_amount numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if existing_package_id is not null then
    select * into package_record
    from public.event_payment_packages
    where id = existing_package_id
      and purchaser_id = auth.uid()
      and status = 'paid'
      and events_used + events_pending < package_size
    for update;
    if package_record.id is null then
      raise exception 'The selected payment package has no remaining event credit';
    end if;

    update public.event_payment_packages
    set events_pending = events_pending + 1, updated_at = now()
    where id = package_record.id;
    package_amount := package_record.amount;
  else
    if selected_package_size not in (1, 2) then
      raise exception 'Select a valid event package';
    end if;
    if nullif(trim(submitted_payment_reference), '') is null then
      raise exception 'Payment reference is required';
    end if;
    package_amount := case when selected_package_size = 1 then 300.00 else 500.00 end;
    insert into public.event_payment_packages (
      purchaser_id, package_size, amount, payment_method, payment_reference
    ) values (
      auth.uid(), selected_package_size, package_amount,
      coalesce(event_data->>'payment_method', 'GCash'), trim(submitted_payment_reference)
    ) returning * into package_record;
  end if;

  insert into public.events (
    host_user_id, organization_name, title, description, venue, event_date,
    start_time, end_time, target_attendees, requires_time_out, status,
    payment_status, payment_method, payment_reference, payment_amount, payment_package_id
  ) values (
    auth.uid(), event_data->>'organization_name', event_data->>'title',
    event_data->>'description', event_data->>'venue',
    (event_data->>'event_date')::date, (event_data->>'start_time')::time,
    (event_data->>'end_time')::time,
    greatest(1, least(5000, coalesce((event_data->>'target_attendees')::integer, 100))),
    coalesce((event_data->>'requires_time_out')::boolean, false),
    'pending_payment', 'pending', event_data->>'payment_method',
    nullif(trim(submitted_payment_reference), ''), package_amount, package_record.id
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

  update public.event_payment_packages
  set status = case
        when decision = 'approve' then 'paid'
        when events_used > 0 then 'paid'
        else 'canceled'
      end,
      events_used = case when decision = 'approve' then events_used + 1 else events_used end,
      events_pending = greatest(0, events_pending - 1),
      updated_at = now()
  where id = reviewed_event.payment_package_id;

  return reviewed_event;
end;
$$;

revoke all on function public.create_event_request(jsonb, text, integer, uuid) from public, anon;
grant execute on function public.create_event_request(jsonb, text, integer, uuid) to authenticated;
