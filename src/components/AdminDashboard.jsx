import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, LogOut, RefreshCw, ShieldCheck, Users, X } from 'lucide-react';
import { getAdminUserActivity, getAdminUsers, getPendingEventRequests, reviewEventPayment } from '../supabaseClient';

export default function AdminDashboard({ currentUser, onLogOut, logoutError }) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [isLoadingUserActivity, setIsLoadingUserActivity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyEventId, setBusyEventId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [pendingRequests, userPage] = await Promise.all([
        getPendingEventRequests(),
        getAdminUsers(),
      ]);
      setRequests(pendingRequests);
      setUsers(userPage.users);
      setUserCount(userPage.totalCount);
      setHasMoreUsers(userPage.users.length < userPage.totalCount);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreUsers = async () => {
    const offset = users.length;
    try {
      const nextPage = await getAdminUsers(offset);
      setUsers((previous) => [...previous, ...nextPage.users]);
      setUserCount(nextPage.totalCount);
      setHasMoreUsers(offset + nextPage.users.length < nextPage.totalCount);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load more users.');
    }
  };

  const openUser = async (user) => {
    setSelectedUser(user);
    setUserActivity(null);
    setIsLoadingUserActivity(true);
    setError('');
    try {
      setUserActivity(await getAdminUserActivity(user.id));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load this user’s activity.');
    } finally {
      setIsLoadingUserActivity(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const decide = async (eventId, decision) => {
    setBusyEventId(eventId);
    setError('');
    setNotice('');
    try {
      const reviewedEvent = await reviewEventPayment(eventId, decision);
      setRequests((previous) => previous.filter((event) => event.id !== eventId));
      setNotice(reviewedEvent.notificationWarning
        ? `${decision === 'approve' ? 'Event approved' : 'Event canceled'}, but the creator notification email failed.`
        : `${decision === 'approve' ? 'Event approved' : 'Event canceled'} and the creator was notified.`);
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to review this payment.');
    } finally {
      setBusyEventId(null);
    }
  };

  const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Unavailable';
  const renderEventRows = (events, emptyMessage, getEvent, getDate) => (
    events.length === 0 ? (
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{emptyMessage}</p>
    ) : (
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {events.map((item) => {
          const event = getEvent(item);
          return (
            <div key={item.id} style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '6px' }}>
              <strong>{event?.title || 'Event unavailable'}</strong>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem', marginTop: '0.25rem' }}>
                {event?.event_date || 'Date unavailable'}{event?.venue ? ` · ${event.venue}` : ''}
                {getDate(item) ? ` · ${formatDate(getDate(item))}` : ''}
              </div>
              {event?.event_code && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{event.event_code}</div>}
            </div>
          );
        })}
      </div>
    )
  );

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-badge" style={{ width: '36px', height: '36px' }}>
            <ShieldCheck size={19} color="#ffffff" />
          </div>
          <div className="logo-text" style={{ fontSize: '1.2rem' }}>attend<span>IDto</span></div>
        </div>
        <div className="sidebar-user">
          <div className="avatar-initials" style={{ width: '38px', height: '38px', fontSize: '0.92rem', background: '#2563eb' }}>AD</div>
          <div className="sidebar-user-info" style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{currentUser.full_name}</div>
            <div className="sidebar-user-meta">Administrator</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-tab ${activeTab === 'inbox' ? 'sidebar-tab-active' : ''}`} onClick={() => setActiveTab('inbox')}>
            <CalendarDays size={20} /><span>Payment Inbox</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'users' ? 'sidebar-tab-active' : ''}`} onClick={() => { setActiveTab('users'); setSelectedUser(null); setUserActivity(null); }}>
            <Users size={20} /><span>Users</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-tab sidebar-tab-logout" onClick={onLogOut}><LogOut size={20} /><span>Sign Out</span></button>
          {logoutError && <div role="alert" style={{ padding: '0.5rem', color: '#fecaca', fontSize: '0.75rem' }}>{logoutError}</div>}
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-tab-content animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.65rem', color: 'var(--color-text-main)' }}>{activeTab === 'inbox' ? 'Payment Inbox' : selectedUser ? selectedUser.full_name : 'Users'}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{activeTab === 'inbox' ? `${requests.length} event payment${requests.length === 1 ? '' : 's'} awaiting review` : selectedUser ? selectedUser.email : `${userCount} registered user${userCount === 1 ? '' : 's'}`}</p>
            </div>
            <button className="btn btn-secondary" onClick={refresh} disabled={isLoading} title="Refresh">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {error && <div role="alert" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px' }}>{error}</div>}
          {notice && <div role="status" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px' }}>{notice}</div>}

          {isLoading && !selectedUser ? <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p> : activeTab === 'inbox' ? (
            requests.length === 0 ? <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No payment requests need review.</div> :
              <div style={{ display: 'grid', gap: '1rem' }}>
                {requests.map((event) => (
                  <section key={event.id} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '1.15rem', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}>{event.event_code} · {event.payment_method || 'Transfer'}</div>
                        <h2 style={{ fontSize: '1.15rem', margin: '0.3rem 0' }}>{event.title}</h2>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{event.profiles?.full_name} · {event.profiles?.email}</div>
                      </div>
                      <div style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                        <div>{event.event_date} · {event.start_time}</div>
                        <div>{event.venue}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.86rem' }}>
                      <span>Payment reference: <strong>{event.payment_reference}</strong></span>
                      <span>Submitted: {new Date(event.created_at).toLocaleString()}</span>
                      <span>Package: <strong>{event.payment_amount >= 500 ? '₱500 · 2 events' : '₱300 · 1 event'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                      <button className="btn btn-secondary" onClick={() => decide(event.id, 'cancel')} disabled={busyEventId === event.id}>
                        <X size={16} /> Cancel event
                      </button>
                      <button className="btn btn-emerald" onClick={() => decide(event.id, 'approve')} disabled={busyEventId === event.id}>
                        <Check size={16} /> Approve payment
                      </button>
                    </div>
                  </section>
                ))}
              </div>
          ) : selectedUser ? (
            <section>
              <button className="btn btn-ghost" onClick={() => { setSelectedUser(null); setUserActivity(null); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                <ArrowLeft size={18} /> Back to users
              </button>
              <div style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#fff' }}>
                <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem' }}>{selectedUser.full_name}</h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{selectedUser.email}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem', marginTop: '0.35rem' }}>
                  {[selectedUser.school, selectedUser.department, selectedUser.course, selectedUser.year_level].filter(Boolean).join(' · ')}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.35rem' }}>Joined {formatDate(selectedUser.created_at)}</div>
              </div>
              {isLoadingUserActivity ? <p style={{ color: 'var(--color-text-muted)' }}>Loading user activity…</p> : userActivity && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[['Events created', userActivity.createdEvents.length], ['Events attended', userActivity.attendedEvents.length]].map(([label, value]) => (
                      <div key={label} style={{ padding: '0.9rem', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{label}</div>
                        <strong style={{ fontSize: '1.25rem' }}>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <section style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#fff' }}>
                      <h3 style={{ margin: '0 0 0.75rem' }}>Events created</h3>
                      {renderEventRows(userActivity.createdEvents, 'This user has not created any events.', (event) => event, (event) => event.created_at)}
                    </section>
                    <section style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#fff' }}>
                      <h3 style={{ margin: '0 0 0.75rem' }}>Events attended</h3>
                      {renderEventRows(userActivity.attendedEvents, 'This user has not attended any events.', (record) => record.event, (record) => record.time_in)}
                    </section>
                  </div>
                </>
              )}
            </section>
          ) : (
            users.length === 0 ? <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No registered users found.</div> :
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table className="flat-table">
                  <thead><tr><th>User</th><th>Email</th><th>School</th><th>Joined</th><th>Activity</th></tr></thead>
                  <tbody>{users.map((user) => (
                    <tr key={user.id}>
                      <td><button className="btn btn-ghost" onClick={() => openUser(user)} style={{ padding: '0.25rem', fontWeight: 700 }}>{user.full_name}</button></td>
                      <td>{user.email}</td>
                      <td>{user.school || '—'}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                      <td><button className="btn btn-secondary" onClick={() => openUser(user)}>View activity</button></td>
                    </tr>
                  ))}</tbody>
                </table>
                {hasMoreUsers && <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <button className="btn btn-secondary" onClick={loadMoreUsers}>Load more users</button>
                </div>}
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
