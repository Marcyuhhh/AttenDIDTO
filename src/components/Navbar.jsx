import React from 'react';
import { PlusCircle, QrCode, Sparkles, User, LogOut, Settings } from 'lucide-react';
import { getAllProfiles, setLocalCurrentUser } from '../supabaseClient';

export default function Navbar({ currentUser, onOpenStartEvent, onOpenProfileEdit, onUserSwitched, onLogOut }) {
  const allProfiles = getAllProfiles();

  const handleSwitchUser = (e) => {
    const selectedId = e.target.value;
    const target = allProfiles.find((p) => p.id === selectedId);
    if (target) {
      setLocalCurrentUser(target);
      if (onUserSwitched) onUserSwitched(target);
    }
  };

  return (
    <header className="navbar no-print">
      <div className="nav-brand">
        <div className="logo-badge">
          <QrCode size={24} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="logo-text">
            attend<span>IDto</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            PRIVACY-FIRST ATTENDANCE
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Quick User Switcher for Class Demos & Evaluation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
          <User size={14} color="var(--color-primary)" />
          <select
            value={currentUser?.id || ''}
            onChange={handleSwitchUser}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-main)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '145px',
            }}
            title="Switch demo account"
          >
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.school.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Start an Event Primary Button */}
        <button 
          id="btn-start-event-header"
          className="btn btn-gold" 
          onClick={onOpenStartEvent}
          style={{ padding: '0.5rem 1rem', fontSize: '0.86rem' }}
        >
          <PlusCircle size={16} />
          <span>Start an Event</span>
        </button>

        {/* Profile Avatar & Settings */}
        <button
          onClick={onOpenProfileEdit}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '2px',
          }}
          title="Edit Profile"
        >
          <img
            src={currentUser?.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser?.full_name}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--color-gold)',
            }}
          />
        </button>

        {/* Log Out Button */}
        <button
          id="btn-logout"
          onClick={onLogOut}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
          title="Log out back to Sign In / Sign Up"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}
