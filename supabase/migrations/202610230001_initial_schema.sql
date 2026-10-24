-- Initial database schema, kept as a migration so Supabase CLI can deploy it from GitHub.
-- Source: supabase_schema.sql

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  school text not null,
  email text not null unique,
  year_level varchar(20) not null check (year_level in ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year')),
  department text not null,
  course text not null,
  profile_picture_url text,
  qr_pass_code varchar(64) unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  host_user_id uuid references public.profiles(id) on delete cascade not null,
  organization_name text,
  title text not null,
  description text,
  venue text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  target_attendees int not null default 100,
  requires_time_out boolean default false,
  status varchar(20) default 'active' check (status in ('active', 'completed', 'archived')),
  payment_status varchar(20) default 'paid' check (payment_status in ('unpaid', 'paid', 'exempted')),
  payment_method varchar(30) default 'GCash',
  payment_reference text,
  payment_amount numeric(10, 2) default 49.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_scanners (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  assigned_label text default 'Main Entrance Scanner',
  created_at timestamptz default now(),
  constraint unique_event_scanner unique (event_id, user_id)
);

create table if not exists public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  participant_id uuid references public.profiles(id) on delete cascade not null,
  scanned_by_user_id uuid references public.profiles(id),
  time_in timestamptz default now() not null,
  time_out timestamptz,
  scanner_device text,
  created_at timestamptz default now(),
  constraint unique_event_participant_attendance unique (event_id, participant_id)
);

create index if not exists idx_attendance_event_id on public.attendance_records(event_id);
create index if not exists idx_attendance_participant_id on public.attendance_records(participant_id);
create index if not exists idx_profiles_qr_code on public.profiles(qr_pass_code);

alter publication supabase_realtime add table public.attendance_records;
alter publication supabase_realtime add table public.events;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance_records enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Active events viewable by authenticated users"
  on public.events for select to authenticated using (true);
create policy "Users can create events"
  on public.events for insert to authenticated with check (auth.uid() = host_user_id);
create policy "Host can update their own event"
  on public.events for update to authenticated using (auth.uid() = host_user_id);

create policy "Attendance viewable by authenticated users"
  on public.attendance_records for select to authenticated using (true);
create policy "Authenticated users can record attendance"
  on public.attendance_records for insert to authenticated with check (true);
