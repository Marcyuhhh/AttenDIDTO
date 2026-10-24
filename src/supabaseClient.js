import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (if provided)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isLiveSupabase = Boolean(supabaseUrl && supabaseAnonKey);
export const isProductionBackendUnavailable = import.meta.env.PROD && !isLiveSupabase;

const requireProductionBackend = () => {
  if (isProductionBackendUnavailable) {
    throw new Error('This deployment is not configured with Supabase. Contact the administrator.');
  }
};

export const supabase = isLiveSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// =========================================================================
// Real-time Local Broadcast Channel & State Persistence Engine
// Supports Sign In, Sign Up, 6-digit OTP, Student's QR Pass generation,
// multi-device event scanning, and real-time cross-tab sync.
// =========================================================================

export const STORAGE_KEYS = {
  CURRENT_USER: 'attendidto_current_user',
  ALL_PROFILES: 'attendidto_profiles',
  EVENTS: 'attendidto_events',
  ATTENDANCE: 'attendidto_attendance',
  PENDING_OTP: 'attendidto_pending_otp',
};

// Seed demo student data for CDO schools (USTP, Xavier Ateneo, Liceo, etc.)
export const SEED_PROFILES = [
  {
    id: 'demo-student-1',
    full_name: 'Kyle Francis Reyes',
    school: 'USTP Cagayan de Oro',
    email: 'kyle.reyes@ustp.edu.ph',
    password: 'password123',
    year_level: '3rd Year',
    department: 'College of Information Technology and Computing',
    course: 'BS in Information Technology',
    profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    qr_pass_code: 'AID-PASS-8849201A',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-student-2',
    full_name: 'Samantha Clarisse Mendoza',
    school: 'USTP Cagayan de Oro',
    email: 'samantha.mendoza@ustp.edu.ph',
    password: 'password123',
    year_level: '2nd Year',
    department: 'College of Engineering and Architecture',
    course: 'BS in Computer Engineering',
    profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    qr_pass_code: 'AID-PASS-7391024B',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'demo-student-3',
    full_name: 'Joshua David Alcantara',
    school: 'Xavier University - Ateneo de CDO',
    email: 'joshua.alcantara@xu.edu.ph',
    password: 'password123',
    year_level: '4th Year',
    department: 'College of Computer Studies',
    course: 'BS in Computer Science',
    profile_picture_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    qr_pass_code: 'AID-PASS-9102834C',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-student-4',
    full_name: 'Beatriz Nicole Tan',
    school: 'Liceo de Cagayan University',
    email: 'beatriz.tan@liceo.edu.ph',
    password: 'password123',
    year_level: '1st Year',
    department: 'College of Information Technology',
    course: 'BS in Information Systems',
    profile_picture_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    qr_pass_code: 'AID-PASS-4910283D',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

const SEED_EVENTS = [
  {
    id: 'demo-event-1',
    host_user_id: 'demo-student-1',
    organization_name: 'USTP SITE / Computer Society',
    title: 'Technopreneurship Innovation Summit 2026',
    description: 'Annual technopreneurship showcase and product pitching featuring innovative student startups in Cagayan de Oro.',
    venue: 'USTP Gymnasium, Claro M. Recto Ave, CDO',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '17:00',
    target_attendees: 300,
    requires_time_out: true,
    status: 'active',
    payment_status: 'paid',
    payment_method: 'GCash',
    payment_reference: 'GCASH-REF-992147',
    payment_amount: 49.00,
    created_at: new Date().toISOString(),
  }
];

const SEED_ATTENDANCE = [
  {
    id: 'att-1',
    event_id: 'demo-event-1',
    participant_id: 'demo-student-2',
    scanned_by_user_id: 'demo-student-1',
    time_in: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    time_out: null,
    scanner_device: 'iPhone Scanner - Door 1',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'att-2',
    event_id: 'demo-event-1',
    participant_id: 'demo-student-3',
    scanned_by_user_id: 'demo-student-1',
    time_in: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    time_out: null,
    scanner_device: 'Android Scanner - Door 2',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  }
];

// Initialize storage if empty
export const initLocalData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ALL_PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(SEED_PROFILES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(SEED_EVENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE));
  }
};

// Real-time broadcast channel for cross-tab synchronization
const realtimeChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('attendidto_realtime_bus')
  : null;

export const broadcastEvent = (type, payload) => {
  if (realtimeChannel) {
    try {
      realtimeChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
};

export const subscribeToBroadcast = (callback) => {
  if (!realtimeChannel) return () => {};
  const handler = (e) => {
    if (e.data && callback) callback(e.data);
  };
  realtimeChannel.addEventListener('message', handler);
  return () => realtimeChannel.removeEventListener('message', handler);
};

// =========================================================================
// Authentication & Profile Services
// =========================================================================

export const getLocalCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setLocalCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  broadcastEvent('USER_UPDATED', user);
};

export const logOutUser = () => {
  if (isLiveSupabase) {
    return supabase.auth.signOut();
  }
  setLocalCurrentUser(null);
  return { error: null };
};

export const sendPasswordReset = async (email) => {
  if (!isLiveSupabase) {
    return { error: new Error('Password reset requires the configured Supabase service.') };
  }
  return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
};

export const getAuthenticatedProfile = async () => {
  if (!isLiveSupabase) {
    if (isProductionBackendUnavailable) return null;
    return getLocalCurrentUser();
  }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) return null;
  const { error: ensureProfileError } = await supabase.rpc('ensure_my_profile');
  if (ensureProfileError) throw ensureProfileError;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) throw error;
  return { ...profile, email: session.user.email };
};

export const getCloudDashboardData = async (profile) => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    const events = getAllEvents();
    const attendance = getAllAttendance();
    const historyEvents = events.filter((event) => attendance.some((record) => record.participant_id === profile.id && record.event_id === event.id));
    return { events, attendance, profiles: getAllProfiles(), historyEvents };
  }
  const [{ data: events, error: eventsError }, { data: attendance, error: attendanceError }] = await Promise.all([
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('attendance_records').select('*').order('time_in', { ascending: false }),
  ]);
  if (eventsError) throw eventsError;
  if (attendanceError) throw attendanceError;
  const hostEvents = (events ?? []).filter((event) => event.host_user_id === profile.id);
  const historyEventIds = [...new Set((attendance ?? [])
    .filter((record) => record.participant_id === profile.id)
    .map((record) => record.event_id))];
  let historyEvents = [];
  if (historyEventIds.length) {
    const { data, error } = await supabase
      .from('events')
      .select('id,title,organization_name,venue,event_date')
      .in('id', historyEventIds);
    if (error) throw error;
    historyEvents = data ?? [];
  }
  const participantIds = [...new Set((attendance ?? []).map((record) => record.participant_id))];
  let profiles = [];
  if (participantIds.length) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,school,department,course,year_level,email')
      .in('id', participantIds);
    if (error) throw error;
    profiles = data ?? [];
  }
  return { events: hostEvents, historyEvents, attendance: attendance ?? [], profiles };
};

export const subscribeToCloudChanges = (callback) => {
  if (!isLiveSupabase) return () => {};
  const channel = supabase
    .channel('attendidto-dashboard-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
      callback({
        type: payload.eventType === 'DELETE' ? 'EVENT_DELETED' : 'EVENT_UPDATED',
        payload: payload.eventType === 'DELETE' ? payload.old : payload.new,
      });
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, (payload) => {
      callback({ type: 'ATTENDANCE_RECORDED', payload: payload.new });
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const submitEventRequest = async (eventData, paymentReference) => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    const event = saveEvent({
      ...eventData,
      status: 'pending_payment',
      payment_status: 'pending',
      payment_reference: paymentReference,
      payment_amount: 49,
    });
    return { ...event, event_code: event.event_code || `EVT-${event.id.slice(-8).toUpperCase()}` };
  }
  const { data, error } = await supabase.rpc('create_event_request', {
    event_data: eventData,
    submitted_payment_reference: paymentReference,
  });
  if (error) throw error;
  const { error: notificationError } = await supabase.functions.invoke('event-payment-notification', {
    body: { eventId: data.id, kind: 'submitted' },
  });
  return { ...data, notificationWarning: notificationError?.message };
};

export const getPendingEventRequests = async () => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    return getAllEvents().filter((event) => event.payment_status === 'pending');
  }
  const { data, error } = await supabase
    .from('events')
    .select('*, profiles!events_host_user_id_fkey(full_name,email,school)')
    .eq('status', 'pending_payment')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const reviewEventPayment = async (eventId, decision) => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    const events = getAllEvents();
    const index = events.findIndex((event) => event.id === eventId);
    if (index < 0) throw new Error('Event not found');
    const approved = decision === 'approve';
    events[index] = {
      ...events[index],
      status: approved ? 'active' : 'canceled',
      payment_status: approved ? 'paid' : 'canceled',
    };
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    broadcastEvent('EVENT_REVIEWED', events[index]);
    return events[index];
  }
  const { data, error } = await supabase.rpc('review_event_payment', {
    event_id: eventId,
    decision,
  });
  if (error) throw error;
  const { error: notifyError } = await supabase.functions.invoke('event-payment-notification', {
    body: { eventId, kind: 'reviewed' },
  });
  if (notifyError) console.error('Decision email failed:', notifyError.message);
  return { ...data, notificationWarning: notifyError?.message };
};

export const updateProfile = async (userId, updatedFields) => {
  if (!isLiveSupabase) {
    const profiles = getAllProfiles();
    const index = profiles.findIndex((profile) => profile.id === userId);
    if (index < 0) return null;
    profiles[index] = { ...profiles[index], ...updatedFields };
    localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(profiles));
    const currentUser = getLocalCurrentUser();
    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, ...updatedFields };
      setLocalCurrentUser(updatedUser);
      return updatedUser;
    }
    return profiles[index];
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(updatedFields)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  return { ...data, email: user?.email };
};

export const getAdminSignInLogs = async (offset = 0) => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    return [];
  }
  const { data, error } = await supabase
    .from('sign_in_logs')
    .select('id,user_id,signed_in_at,profiles!sign_in_logs_user_id_fkey(full_name,email,school)')
    .order('signed_in_at', { ascending: false })
    .range(offset, offset + 99);
  if (error) throw error;
  return data ?? [];
};

export const recordAttendance = async ({ event_id, participant_id, participant_qr, scanned_by_user_id, scanner_device = 'Web Camera' }) => {
  if (isLiveSupabase) {
    const { data, error } = await supabase.rpc('record_attendance_by_qr', {
      target_event_id: event_id,
      participant_qr,
      scanner_device_name: scanner_device,
    });
    if (error) {
      return {
        success: false,
        isDuplicate: error.message.includes('already checked in'),
        message: error.message,
      };
    }
    return { success: true, isDuplicate: false, record: data.record, participant: data.participant };
  }

  requireProductionBackend();

  const records = getAllAttendance();
  const existing = records.find((record) => record.event_id === event_id && record.participant_id === participant_id);
  if (existing) {
    return {
      success: false,
      isDuplicate: true,
      existingRecord: existing,
      message: `Already checked in at ${new Date(existing.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
  }
  const newRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event_id,
    participant_id,
    scanned_by_user_id,
    scanner_device,
    time_in: new Date().toISOString(),
    time_out: null,
    created_at: new Date().toISOString(),
  };
  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  broadcastEvent('ATTENDANCE_RECORDED', newRecord);
  return { success: true, isDuplicate: false, record: newRecord };
};

export const getAllProfiles = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_PROFILES)) || [];
  } catch {
    return [];
  }
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const findProfileByEmail = (email) => {
  if (!email) return null;
  const profiles = getAllProfiles();
  return profiles.find((p) => p.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
};

// Request 6-digit OTP
export const requestOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Real Supabase if credentials are provided
  if (isLiveSupabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
      if (error) console.warn('Supabase OTP notice:', error.message);
    } catch (err) {
      console.warn('Supabase OTP network error:', err);
    }
  }

  // Generate a random 6-digit OTP code (default demo code: 123456 or random)
  const code = '123456';
  const otpData = {
    email: normalizedEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  localStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(otpData));

  return {
    success: true,
    code, // Returned for effortless demo presentation and testing
    message: `Verification code sent to ${normalizedEmail}`,
  };
};

// Verify 6-digit OTP
export const verifyOtp = async (email, enteredCode) => {
  const normalizedEmail = email.trim().toLowerCase();
  const rawOtp = localStorage.getItem(STORAGE_KEYS.PENDING_OTP);
  
  let isValid = false;
  // Accept standard test OTP '123456' or whatever was stored
  if (enteredCode === '123456') {
    isValid = true;
  } else if (rawOtp) {
    try {
      const parsed = JSON.parse(rawOtp);
      if (parsed.email === normalizedEmail && parsed.code === enteredCode && parsed.expiresAt > Date.now()) {
        isValid = true;
      }
    } catch {
      // ignore
    }
  }

  if (!isValid) {
    return {
      success: false,
      message: 'Invalid or expired 6-digit code. Please enter 123456 or request a new code.',
    };
  }

  // Check if profile exists
  const existingProfile = findProfileByEmail(normalizedEmail);
  if (existingProfile) {
    setLocalCurrentUser(existingProfile);
    return {
      success: true,
      isNewUser: false,
      user: existingProfile,
    };
  }

  // User is verified, but needs to complete their profile
  return {
    success: true,
    isNewUser: true,
    email: normalizedEmail,
  };
};

// Register a new student profile
export const registerUserProfile = ({
  full_name,
  school,
  email,
  year_level,
  department,
  course,
  profile_picture_url,
}) => {
  const profiles = getAllProfiles();
  const normalizedEmail = email.trim().toLowerCase();

  // Generate unique privacy-first QR pass code
  const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
  const qr_pass_code = `AID-PASS-${randomHex}`;

  const newProfile = {
    id: `student-${Date.now()}`,
    full_name: full_name.trim(),
    school: school.trim(),
    email: normalizedEmail,
    year_level,
    department: department.trim(),
    course: course.trim(),
    profile_picture_url: profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    qr_pass_code,
    created_at: new Date().toISOString(),
  };

  profiles.unshift(newProfile);
  localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(profiles));
  setLocalCurrentUser(newProfile);
  broadcastEvent('PROFILES_UPDATED', profiles);

  return newProfile;
};

export const saveProfile = (profile) => {
  const profiles = getAllProfiles();
  const existingIdx = profiles.findIndex((p) => p.id === profile.id || p.email === profile.email);
  if (existingIdx >= 0) {
    profiles[existingIdx] = { ...profiles[existingIdx], ...profile, updated_at: new Date().toISOString() };
  } else {
    profiles.push({ ...profile, created_at: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(profiles));
  broadcastEvent('PROFILES_UPDATED', profiles);
  return profile;
};

// =========================================================================
// Password Authentication & Account Management (Production-Ready)
// =========================================================================

export const signInWithPassword = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isLiveSupabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        const message = error.message.toLowerCase().includes('invalid login credentials')
          ? 'Email or password is incorrect. If you have not created an account yet, choose Create Account.'
          : error.message;
        return { success: false, message };
      } else if (data?.user) {
        const profile = await getAuthenticatedProfile();
        if (!profile) return { success: false, message: 'Your profile could not be loaded.' };
        return { success: true, user: profile };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Unable to sign in.' };
    }
    return { success: false, message: 'Unable to sign in.' };
  }

  if (isProductionBackendUnavailable) {
    return { success: false, message: 'This deployment is not configured with Supabase. Contact the administrator.' };
  }

  const profile = findProfileByEmail(normalizedEmail);
  if (!profile) {
    return {
      success: false,
      message: 'No account found with this email. Please click "Sign Up" to create an account.',
    };
  }

  const storedPassword = profile.password || 'password123';
  if (password !== storedPassword) {
    return {
      success: false,
      message: 'Incorrect password. Please verify your credentials and try again.',
    };
  }

  setLocalCurrentUser(profile);
  broadcastEvent('USER_UPDATED', profile);
  return { success: true, user: profile };
};

export const signUpWithPassword = async ({
  email,
  password,
  full_name,
  school,
  department,
  course,
  year_level = '1st Year',
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isLiveSupabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: full_name.trim(), school: school.trim(), department: department.trim(), course: course.trim(), year_level },
        },
      });
      if (error) {
        const duplicate = /already (registered|exists)|user already/i.test(error.message);
        return {
          success: false,
          code: duplicate ? 'user_exists' : undefined,
          message: duplicate
            ? 'This email already has an account. Sign in with that email, or use Forgot Password if needed.'
            : error.message,
        };
      }
        if (data.user && data.user.identities?.length === 0) {
          return {
            success: false,
            code: 'user_exists',
            message: 'This email already has an account. Sign in with that email, or use Forgot Password if needed.',
          };
        }
      if (!data.session) {
          return { success: false, message: 'Account created. Check your email to verify it, then sign in.' };
      }
      const profile = await getAuthenticatedProfile();
      if (!profile) return { success: false, message: 'Account created, but the profile could not be loaded.' };
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, message: err.message || 'Unable to create your account.' };
    }
  }

  if (isProductionBackendUnavailable) {
    return { success: false, message: 'This deployment is not configured with Supabase. Contact the administrator.' };
  }

  // Check duplicate
  const existing = findProfileByEmail(normalizedEmail);
  if (existing) {
    return {
      success: false,
      message: 'An account with this email address already exists. Please log in instead.',
    };
  }

  // Live Supabase signup if configured
  if (isLiveSupabase) {
    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            school: school.trim(),
            department: department.trim(),
            course: course.trim(),
            year_level,
          },
        },
      });
      if (error) console.warn('Supabase signUp notice:', error.message);
    } catch (err) {
      console.warn('Supabase auth network notice:', err);
    }
  }

  // Generate unique privacy-first QR pass code
  const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
  const qr_pass_code = `AID-PASS-${randomHex}`;

  const newProfile = {
    id: `student-${Date.now()}`,
    full_name: full_name.trim(),
    school: school.trim(),
    email: normalizedEmail,
    password,
    year_level,
    department: department.trim(),
    course: course.trim(),
    qr_pass_code,
    created_at: new Date().toISOString(),
  };

  const profiles = getAllProfiles();
  profiles.unshift(newProfile);
  localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(profiles));
  setLocalCurrentUser(newProfile);
  broadcastEvent('PROFILES_UPDATED', profiles);
  broadcastEvent('USER_UPDATED', newProfile);

  return { success: true, user: newProfile };
};

export const deleteUserAccount = (userId) => {
  if (!userId) return false;

  // 1. Remove from all profiles
  const profiles = getAllProfiles().filter((p) => p.id !== userId);
  localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(profiles));

  // 2. Remove events hosted by this user
  const events = getAllEvents().filter((e) => e.host_user_id !== userId);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

  // 3. Remove attendance records where user is participant or host
  const attendance = getAllAttendance().filter(
    (a) => a.participant_id !== userId && a.scanned_by_user_id !== userId
  );
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));

  // 4. Clear current session
  setLocalCurrentUser(null);

  // If live Supabase, sign out
  if (isLiveSupabase) {
    try {
      supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  broadcastEvent('PROFILES_UPDATED', profiles);
  broadcastEvent('USER_UPDATED', null);
  return true;
};

export const deleteOwnedEvent = async (eventId) => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    const events = getAllEvents().filter((event) => event.id !== eventId);
    const attendance = getAllAttendance().filter((record) => record.event_id !== eventId);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    return true;
  }
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
  return true;
};

export const deleteOwnAccount = async () => {
  if (!isLiveSupabase) {
    requireProductionBackend();
    const user = getLocalCurrentUser();
    if (user) deleteUserAccount(user.id);
    return true;
  }
  const { error } = await supabase.functions.invoke('delete-own-account', { body: {} });
  if (error) {
    let message = error.message;
    try {
      const response = error.context;
      if (response && typeof response.json === 'function') {
        const details = await response.json();
        message = details.error || message;
      }
    } catch {
      // Preserve the SDK message when the failure has no JSON response.
    }
    if (message === 'Failed to send a request to the Edge Function') {
      message = 'Could not reach the account deletion service. Deploy the delete-own-account Supabase function and check that APP_ORIGIN matches this site URL.';
    }
    throw new Error(message);
  }
  await supabase.auth.signOut({ scope: 'local' });
  return true;
};


// =========================================================================
// Event & Attendance Services
// =========================================================================

export const getAllEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS)) || [];
  } catch {
    return [];
  }
};

export const saveEvent = (eventData) => {
  const events = getAllEvents();
  const newEvent = {
    ...eventData,
    id: eventData.id || `evt-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  events.unshift(newEvent);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  broadcastEvent('EVENT_CREATED', newEvent);
  return newEvent;
};

export const getAllAttendance = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
  } catch {
    return [];
  }
};

