import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Clock3, LogOut, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { getAdminSignInLogs, getPendingEventRequests, reviewEventPayment } from '../supabaseClient';

export default function AdminDashboard({ currentUser, onLogOut, logoutError }) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [requests, setRequests] = useState([]);
  const [signIns, setSignIns] = useState([]);
  const [signInOffset, setSignInOffset] = useState(0);
  const [hasMoreSignIns, setHasMoreSignIns] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyEventId, setBusyEventId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [pendingRequests, signInLogs] = await Promise.all([
        getPendingEventRequests(),
        getAdminSignInLogs(),
      ]);
      setRequests(pendingRequests);
      setSignIns(signInLogs);
      setSignInOffset(0);
      setHasMoreSignIns(signInLogs.length === 100);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreSignIns = async () => {
    const nextOffset = signInOffset + 100;
    try {
      const nextPage = await getAdminSignInLogs(nextOffset);
      setSignIns((previous) => [...previous, ...nextPage]);
      setSignInOffset(nextOffset);
      setHasMoreSignIns(nextPage.length === 100);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load more sign-in records.');
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
          <button className={`sidebar-tab ${activeTab === 'signins' ? 'sidebar-tab-active' : ''}`} onClick={() => setActiveTab('signins')}>
            <Clock3 size={20} /><span>User Sign-ins</span>
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
              <h1 style={{ fontSize: '1.65rem', color: 'var(--color-text-main)' }}>{activeTab === 'inbox' ? 'Payment Inbox' : 'User Sign-ins'}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{activeTab === 'inbox' ? `${requests.length} event payment${requests.length === 1 ? '' : 's'} awaiting review` : 'Latest successful Supabase sign-ins'}</p>
            </div>
            <button className="btn btn-secondary" onClick={refresh} disabled={isLoading} title="Refresh">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {error && <div role="alert" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px' }}>{error}</div>}
          {notice && <div role="status" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px' }}>{notice}</div>}

          {isLoading ? <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p> : activeTab === 'inbox' ? (
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
                      <span>Fee: <strong>₱49.00</strong></span>
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
          ) : (
            signIns.length === 0 ? <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No sign-in records yet.</div> :
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table className="flat-table">
                  <thead><tr><th>User</th><th>Email</th><th>Signed in</th></tr></thead>
                  <tbody>{signIns.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.profiles?.full_name || entry.user_id}</td>
                      <td>{entry.profiles?.email || 'Unavailable'}</td>
                      <td>{new Date(entry.signed_in_at).toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {hasMoreSignIns && <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <button className="btn btn-secondary" onClick={loadMoreSignIns}>Load older sign-ins</button>
                </div>}
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
