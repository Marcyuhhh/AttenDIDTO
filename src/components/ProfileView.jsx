import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Download, 
  UserCog, 
  Settings, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  X
} from 'lucide-react';
import { getInitials } from '../supabaseClient';
import { sound } from '../audioEffects';

export default function ProfileView({ user, onOpenEditProfile, onDeleteAccount }) {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(user.qr_pass_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPass = () => {
    const svg = document.getElementById('profile-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 120;
      if (ctx) {
        // Background card
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header border top
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 0, canvas.width, 8);

        // Title text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(user.full_name, canvas.width / 2, 36);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(user.school, canvas.width / 2, 54);

        // Draw QR
        ctx.drawImage(img, 30, 70);

        // Token code
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(user.qr_pass_code, canvas.width / 2, canvas.height - 24);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `attendIDto-Pass-${user.full_name.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      sound.playSuccess();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    sound.playWarning();
    if (onDeleteAccount) {
      await onDeleteAccount();
    }
  };

  return (
    <div className="profile-page-view animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            <ShieldCheck size={16} />
            <span>Student Identity & Account</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text-main)', margin: 0 }}>
            Profile
          </h1>
        </div>

        {/* Action Buttons in Header: Edit Profile, Save Pass to Photos, Settings */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            id="btn-profile-edit"
            className="btn btn-secondary" 
            style={{ padding: '0.65rem 1.15rem', fontSize: '0.88rem' }}
            onClick={onOpenEditProfile}
          >
            <UserCog size={16} />
            <span>Edit Profile</span>
          </button>

          <button 
            id="btn-profile-save-photo"
            className="btn btn-primary" 
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            onClick={handleDownloadPass}
          >
            <Download size={16} />
            <span>Save Pass to Photos</span>
          </button>

          <button 
            id="btn-profile-settings"
            className={`btn ${showSettings ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '0.65rem 1rem', fontSize: '0.88rem' }}
            onClick={() => setShowSettings(!showSettings)}
            title="Account Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Profile Info Section (Flat layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Left: Identity & Academic Details */}
        <div>
          {/* Identity Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div 
              className="avatar-initials" 
              style={{ width: '72px', height: '72px', fontSize: '1.65rem', background: '#1e40af' }}
            >
              {getInitials(user.full_name)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.15rem' }}>
                {user.full_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                {user.school}
              </div>
            </div>
          </div>

          {/* Academic Info Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', marginTop: '2px' }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-light)', fontWeight: 700 }}>
                  Academic Year Level
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {user.year_level}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', marginTop: '2px' }}>
                <BookOpen size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-light)', fontWeight: 700 }}>
                  Degree Program / Course
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {user.course}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', marginTop: '2px' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-light)', fontWeight: 700 }}>
                  College / Department
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
                  {user.department}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Student profile registered on {user.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Campus System'}
          </div>
        </div>

        {/* Right: Student's QR Pass preview & Token code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            Official Campus Pass QR Code
          </div>

          <div 
            style={{ 
              padding: '16px', 
              background: '#ffffff', 
              border: '2px solid var(--color-border)', 
              borderRadius: 'var(--radius-lg)',
            }} 
          >
            <QRCodeSVG
              id="profile-qr-svg"
              value={user.qr_pass_code}
              size={190}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <code style={{ fontSize: '0.84rem', background: '#f1f5f9', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', color: '#334155', fontWeight: 700, letterSpacing: '0.04em' }}>
              {user.qr_pass_code}
            </code>
            <button
              onClick={handleCopyCode}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: copied ? 'var(--color-success)' : 'var(--color-primary)', 
                fontSize: '0.8rem', 
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Copy QR token"
            >
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.65rem', maxWidth: '260px' }}>
            Scan at event doorways to instantly register attendance without revealing ID numbers.
          </p>
        </div>

      </div>

      {/* Settings Section (Opened by clicking the Settings button) */}
      {showSettings && (
        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.75rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', fontWeight: 800 }}>
                Account Settings
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Security options and account management
              </p>
            </div>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              onClick={() => setShowSettings(false)}
            >
              Close Settings
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Security Box */}
            <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                <KeyRound size={16} />
                <span>Password & Authentication</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Your account is protected with password authentication. Password hash is encrypted in local security and synced via Supabase.
              </p>
            </div>

            {/* Danger Zone Box */}
            <div style={{ padding: '1.25rem', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', background: '#fff5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem' }}>
                <AlertTriangle size={16} />
                <span>Danger Zone</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#7f1d1d', marginBottom: '1rem' }}>
                Permanently delete your student account, QR pass token, and all hosted event records.
              </p>
              <button
                id="btn-delete-account"
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                <Trash2 size={15} />
                <span>Delete Account</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Account */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', textAlign: 'center' }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>
              Delete Account Permanently?
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete your account? This will permanently remove your student profile (<strong>{user.email}</strong>), your personal QR pass code, and any events or attendance logs associated with you.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.7rem' }}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button"
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
