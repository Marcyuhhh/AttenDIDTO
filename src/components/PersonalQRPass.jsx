import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { getInitials } from '../supabaseClient';

export default function PersonalQRPass({ user, onNavigateToProfile }) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(user.qr_pass_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        {/* Quick hint to profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
          <span>To edit profile details, save your pass to photos, or manage account settings, select</span>
          <button 
            onClick={onNavigateToProfile}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Profile
          </button>
          <span>in the sidebar.</span>
        </div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <code style={{ fontSize: '0.82rem', background: '#f1f5f9', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)', color: '#334155', fontWeight: 700, letterSpacing: '0.04em' }}>
            {user.qr_pass_code}
          </code>
          <button
            onClick={handleCopyCode}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: copied ? 'var(--color-success)' : 'var(--color-primary)', 
              fontSize: '0.78rem', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
            title="Copy QR token"
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy Code</>}
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem', maxWidth: '240px' }}>
          Present this code at any campus event scanner station
        </p>
      </div>
    </div>
  );
}
