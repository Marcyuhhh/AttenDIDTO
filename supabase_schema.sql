-- =========================================================================
-- attendIDto: Supabase Database Schema
-- Unified Single-Account Model for Students & Event Organizers
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UNIFIED USER PROFILES (1 Account Per Person)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  school TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  year_level VARCHAR(20) NOT NULL CHECK (year_level IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year')),
  department TEXT NOT NULL,                  -- E.g. "College of Information Technology and Computing"
  course TEXT NOT NULL,                      -- E.g. "BS in Information Technology"
  profile_picture_url TEXT,
  qr_pass_code VARCHAR(64) UNIQUE NOT NULL, -- Permanent QR pass token (e.g. AID-PASS-9F2B81C4)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS (Created by any user via "Start an Event")
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_name TEXT,                    -- Optional: e.g. "Google Developer Student Clubs", "JPCS"
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  target_attendees INT NOT NULL DEFAULT 100,
  requires_time_out BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Monetization Tracking (Technopreneurship Requirement)
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('unpaid', 'paid', 'exempted')),
  payment_method VARCHAR(30) DEFAULT 'GCash',
  payment_reference TEXT,
  payment_amount NUMERIC(10, 2) DEFAULT 49.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENT CO-SCANNERS (Allows multiple devices / co-organizers to scan for the same event)
CREATE TABLE IF NOT EXISTS public.event_scanners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_label TEXT DEFAULT 'Main Entrance Scanner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_event_scanner UNIQUE (event_id, user_id)
);

-- 4. ATTENDANCE RECORDS (Centralized scan records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scanned_by_user_id UUID REFERENCES public.profiles(id),
  time_in TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  time_out TIMESTAMPTZ,
  scanner_device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Guard against duplicate check-in for the same event
  CONSTRAINT unique_event_participant_attendance UNIQUE (event_id, participant_id)
);

-- High-speed indexes for instantaneous lookup during peak door queues
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON public.attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_participant_id ON public.attendance_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_qr_code ON public.profiles(qr_pass_code);

-- Enable Supabase Realtime for attendance records
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Row Level Security (RLS) setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Events Policies
CREATE POLICY "Active events viewable by authenticated users" 
ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create events" 
ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can update their own event" 
ON public.events FOR UPDATE TO authenticated USING (auth.uid() = host_user_id);

-- Attendance Policies
CREATE POLICY "Attendance viewable by authenticated users" 
ON public.attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can record attendance" 
ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (true);
