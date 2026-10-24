import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { 
  initLocalData, 
  getAuthenticatedProfile,
  getCloudDashboardData,
  getAllAttendance,
  getAllProfiles,
  subscribeToBroadcast,
  subscribeToCloudChanges,
  getInitials,
} from './supabaseClient';

const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const PersonalQRPass = lazy(() => import('./components/PersonalQRPass'));
const EventConsole = lazy(() => import('./components/EventConsole'));
const StartEventModal = lazy(() => import('./components/StartEventModal'));
const ParticipantScannerModal = lazy(() => import('./components/ParticipantScannerModal'));
const PrintReportModal = lazy(() => import('./components/PrintReportModal'));
const EditProfileModal = lazy(() => import('./components/EditProfileModal'));
const AttendanceHistory = lazy(() => import('./components/AttendanceHistory'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
import { 
  QrCode, 
  Home, 
  CalendarDays, 
  Clock, 
  LogOut, 
  PlusCircle, 
  ShieldCheck, 
  ArrowLeft, 
  Users, 
  ChevronRight,
  UserCog
} from 'lucide-react';

const loadingFallback = (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
    <div style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading...</div>
  </div>
);

export default function App() {
  // View state: 'landing' | 'auth' | 'dashboard'
  const [view, setView] = useState('landing');

  // Dashboard tab state: 'home' | 'events' | 'history'
  const [activeTab, setActiveTab] = useState('home');

  // When viewing a specific event's detail inside "My Events" tab
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const currentUserIdRef = useRef(null);

  // Modals state
  const [isStartEventOpen, setIsStartEventOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!import.meta.env.PROD) initLocalData();
      try {
        const user = await getAuthenticatedProfile();
        if (!mounted) return;
        setCurrentUser(user);
        currentUserIdRef.current = user?.id ?? null;
        if (user) {
          const { events: cloudEvents, attendance, profiles: cloudProfiles, historyEvents: cloudHistoryEvents } = await getCloudDashboardData(user);
          if (!mounted) return;
          setEvents(cloudEvents);
          setAttendanceRecords(attendance);
          setProfiles(cloudProfiles);
          setHistoryEvents(cloudHistoryEvents);
          setView('dashboard');
        } else {
          setEvents(getAllEvents());
          setAttendanceRecords(getAllAttendance());
          setProfiles(getAllProfiles());
          setHistoryEvents(getAllEvents());
        }
      } catch (error) {
        console.error('Unable to initialize account data:', error);
        if (mounted) {
          setCurrentUser(null);
          setView('auth');
        }
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };
    initialize();

    // Subscribe to multi-device real-time broadcast bus
    const unsubscribe = subscribeToBroadcast((data) => {
      if (data.type === 'ATTENDANCE_RECORDED') {
        setAttendanceRecords((prev) => [data.payload, ...prev.filter((r) => r.id !== data.payload.id)]);
      } else if (data.type === 'EVENT_CREATED') {
        setEvents((prev) => [data.payload, ...prev]);
      } else if (data.type === 'USER_UPDATED') {
        setCurrentUser(data.payload);
      }
    });
    const unsubscribeCloud = subscribeToCloudChanges((data) => {
      if (data.type === 'ATTENDANCE_RECORDED') {
        setAttendanceRecords((previous) => [data.payload, ...previous.filter((record) => record.id !== data.payload.id)]);
      } else if (data.type === 'EVENT_UPDATED' && data.payload?.id) {
        setEvents((previous) => {
          if (data.payload.host_user_id !== currentUserIdRef.current) return previous;
          return [data.payload, ...previous.filter((event) => event.id !== data.payload.id)];
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      unsubscribeCloud();
    };
  }, []);

  const handleEventCreated = useCallback((newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setSelectedEventId(null);
  }, []);

  const handleScanRecorded = useCallback((newRecord, participant) => {
    setAttendanceRecords((previous) => [newRecord, ...previous.filter((record) => record.id !== newRecord.id)]);
    if (participant) {
      setProfiles((previous) => [participant, ...previous.filter((profile) => profile.id !== participant.id)]);
    }
  }, []);

  const handleLogOut = useCallback(() => {
    logOutUser();
    setCurrentUser(null);
    setActiveTab('home');
    setSelectedEventId(null);
    setView('landing');
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const getEventAttendanceCount = useCallback((eventId) => {
    return attendanceRecords.filter((record) => record.event_id === eventId).length;
  }, [attendanceRecords]);

  const userFirstName = useMemo(
    () => currentUser?.full_name?.split(' ')[0] || '',
    [currentUser]
  );

  const sidebarTabs = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: <Home size={20} /> },
      { id: 'events', label: 'My Events', icon: <CalendarDays size={20} /> },
      { id: 'history', label: 'History', icon: <Clock size={20} /> },
    ],
    []
  );

  // ─── VIEW 1: Landing Page ───
  if (view === 'landing') {
    if (isInitializing) return loadingFallback;
    return (
      <LandingPage 
        onGoToAuth={() => {
          setView('auth');
          window.scrollTo({ top: 0 });
        }} 
      />
    );
  }

  // ─── VIEW 2: Auth Screen ───
  if (view === 'auth' || !currentUser) {
    if (isInitializing) return loadingFallback;
    return (
      <AuthScreen 
        onGoBack={() => {
          setView('landing');
          window.scrollTo({ top: 0 });
        }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          currentUserIdRef.current = user.id;
          getCloudDashboardData(user).then(({ events: cloudEvents, attendance, profiles: cloudProfiles, historyEvents: cloudHistoryEvents }) => {
            setEvents(cloudEvents);
            setAttendanceRecords(attendance);
            setProfiles(cloudProfiles);
            setHistoryEvents(cloudHistoryEvents);
            setView('dashboard');
          }).catch((error) => {
            console.error('Unable to load account data:', error);
            setCurrentUser(null);
            setView('auth');
          });
        }} 
      />
    );
  }

  if (currentUser.role === 'admin') {
    return (
      <Suspense fallback={loadingFallback}>
        <AdminDashboard currentUser={currentUser} onLogOut={handleLogOut} />
      </Suspense>
    );
  }

  // ─── VIEW 3: Authenticated Dashboard with Sidebar ───
  return (
    <Suspense fallback={loadingFallback}>
    <div className="dashboard-shell">

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="sidebar">
        {/* Sidebar Brand */}
        <div className="sidebar-brand">
          <div className="logo-badge" style={{ width: '36px', height: '36px' }}>
            <QrCode size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div className="logo-text" style={{ fontSize: '1.2rem' }}>attend<span>IDto</span></div>
        </div>

        {/* User Avatar & Name */}
        <div className="sidebar-user">
          <div className="avatar-initials" style={{ width: '38px', height: '38px', fontSize: '0.92rem', background: '#2563eb' }}>
            {getInitials(currentUser.full_name)}
          </div>
          <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{currentUser.full_name}</div>
            <div className="sidebar-user-meta">{currentUser.year_level}</div>
          </div>
          <button
            onClick={() => setIsProfileOpen(true)}
            title="Edit Profile"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <UserCog size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="sidebar-nav">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-tab ${activeTab === tab.id ? 'sidebar-tab-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedEventId(null);
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Sign Out at Bottom */}
        <div className="sidebar-footer">
          <button className="sidebar-tab sidebar-tab-logout" onClick={handleLogOut}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="dashboard-main">

        {/* ══════════════════════════════════════════
            TAB: HOME
            ══════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="dashboard-tab-content animate-fade-in">
            {/* Greeting Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                <ShieldCheck size={16} />
                <span>Cagayan de Oro Campus Network</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text-main)' }}>
                Welcome back, <span style={{ color: 'var(--color-primary)' }}>{userFirstName}</span>!
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {currentUser.school} • {currentUser.course} ({currentUser.year_level})
              </p>
            </div>

            {/* Personal QR Pass with Edit Profile handler */}
            <PersonalQRPass 
              user={currentUser} 
              onOpenEditProfile={() => setIsProfileOpen(true)}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: MY EVENTS
            ══════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div className="dashboard-tab-content animate-fade-in">

            {/* Sub-view: Event Detail (replaces list inline) */}
            {selectedEvent ? (
              <div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedEventId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  <ArrowLeft size={18} />
                  <span>Back to My Events</span>
                </button>

                <EventConsole
                  event={selectedEvent}
                  attendanceRecords={attendanceRecords}
                  profiles={profiles}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenReport={() => setIsReportOpen(true)}
                />
              </div>
            ) : (
              /* Sub-view: Event Cards List */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem' }}>My Events</h2>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                      {events.length === 0 ? 'You haven\'t created any events yet.' : `${events.length} event${events.length !== 1 ? 's' : ''} created`}
                    </p>
                  </div>
                  <button
                    className="btn btn-gold"
                    onClick={() => setIsStartEventOpen(true)}
                    style={{ padding: '0.7rem 1.35rem', fontSize: '0.92rem' }}
                  >
                    <PlusCircle size={18} />
                    <span>Start an Event</span>
                  </button>
                </div>

                {events.length === 0 ? (
                  <div style={{ padding: '4.5rem 1rem', textAlign: 'center' }}>
                    <CalendarDays size={42} color="var(--color-primary)" style={{ margin: '0 auto 1.25rem', opacity: 0.7 }} />
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: 700 }}>No Events Created Yet</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
                      Host a campus seminar, departmental election, workshop, or general assembly to start scanning participants in real time.
                    </p>
                    <button className="btn btn-gold" onClick={() => setIsStartEventOpen(true)} style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}>
                      <PlusCircle size={18} />
                      <span>Start Your First Event</span>
                    </button>
                  </div>
                ) : (
                  <div className="event-cards-grid">
                    {events.filter((evt) => evt.status !== 'canceled').map((evt) => {
                      const attendCount = getEventAttendanceCount(evt.id);
                      const progress = evt.target_attendees > 0 ? Math.round((attendCount / evt.target_attendees) * 100) : 0;
                      return (
                        <button
                          key={evt.id}
                          className="event-card"
                          onClick={() => evt.status === 'active' && setSelectedEventId(evt.id)}
                          disabled={evt.status !== 'active'}
                          aria-label={evt.status === 'active' ? `Open ${evt.title}` : `${evt.title} pending payment review`}
                        >
                          <div className="event-card-top">
                            <div className="event-card-icon">
                              <CalendarDays size={20} />
                            </div>
                            {evt.status === 'active' ? <ChevronRight size={18} className="event-card-chevron" /> : <span style={{ color: '#b45309', fontSize: '0.75rem', fontWeight: 700 }}>PENDING</span>}
                          </div>
                          <h3 className="event-card-title">{evt.title}</h3>
                          <p className="event-card-meta">
                            {new Date(evt.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {evt.venue && ` • ${evt.venue}`}
                          </p>
                          <div className="event-card-stats">
                            <div className="event-card-attendance">
                              <Users size={14} />
                              <span>{attendCount} / {evt.target_attendees}</span>
                            </div>
                            <div className="event-card-progress-track">
                              <div 
                                className="event-card-progress-fill" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <span className="event-card-percent">{progress}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: HISTORY
            ══════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="dashboard-tab-content animate-fade-in">
            <AttendanceHistory 
              currentUser={currentUser} 
              attendanceRecords={attendanceRecords} 
              events={historyEvents}
            />
          </div>
        )}

      </main>

      {/* ─── MODALS (kept as overlays) ─── */}
      {isStartEventOpen && (
        <StartEventModal
          currentUser={currentUser}
          onClose={() => setIsStartEventOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}

      {isScannerOpen && selectedEvent && (
        <ParticipantScannerModal
          event={selectedEvent}
          currentUser={currentUser}
          profiles={profiles}
          onClose={() => setIsScannerOpen(false)}
          onAttendanceRecorded={handleScanRecorded}
        />
      )}

      {isReportOpen && selectedEvent && (
        <PrintReportModal
          event={selectedEvent}
          attendanceRecords={attendanceRecords}
          profiles={profiles}
          currentUser={currentUser}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {isProfileOpen && (
        <EditProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onSave={(updated) => setCurrentUser(updated)}
        />
      )}
    </div>
    </Suspense>
  );
}
