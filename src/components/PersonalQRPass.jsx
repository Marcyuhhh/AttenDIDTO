import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getInitials } from '../supabaseClient';

export default function PersonalQRPass({ user, onNavigateToProfile }) {
  if (!user) return null;

  return (
    <div className="flat-qr-section">
      {/* Left Column: Student Academic Identity (Flat) */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div 
            className="avatar-initials" 
            style={{ width: '64px', height: '64px', fontSize: '1.45rem', background: '#1e40af' }}
          >
            {getInitials(user.full_name)}
          </div>

          <div>
            <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
              Campus Student QR Pass
            </div>
            <h2 style={{ fontSize: '1.65rem', color: 'var(--color-text-main)', fontWeight: 800, marginBottom: '0.15rem' }}>
              {user.full_name}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {user.school}
            </p>
          </div>
        </div>

        {/* Academic Details - Flat Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', padding: '1.5rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Academic Year</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{user.year_level}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Degree Program</div>
            <div style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.25rem' }}>{user.course}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>College / Department</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{user.department}</div>
          </div>
        </div>

        <button className="home-profile-link" onClick={onNavigateToProfile}>
          Manage your profile, QR pass, and account settings
        </button>
      </div>

      {/* Right Column: Flat QR Code Display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div 
          style={{ 
            padding: '16px', 
            background: '#ffffff', 
            border: '2px solid var(--color-border)', 
            borderRadius: 'var(--radius-lg)',
          }} 
        >
          <QRCodeSVG
            id="student-qr-svg"
            value={user.qr_pass_code}
            size={190}
            level="H"
            includeMargin={false}
            fgColor="#0f172a"
          />
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem', maxWidth: '240px' }}>
          Present this QR pass at any campus event scanner station
        </p>
      </div>
    </div>
  );
}
