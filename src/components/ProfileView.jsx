import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
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
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { getInitials, updateProfile } from '../supabaseClient';
import { sound } from '../audioEffects';

export default function ProfileView({ user, view = 'profile', onViewChange, onOpenEditProfile, onSaveProfile, onDeleteAccount, onLogOut }) {
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editValues, setEditValues] = useState({
    full_name: user?.full_name || '',
    school: user?.school || '',
    year_level: user?.year_level || '',
    department: user?.department || '',
    course: user?.course || '',
  });

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
    setErrorMessage('');
    sound.playWarning();
    if (onDeleteAccount) {
      try {
        await onDeleteAccount();
      } catch (error) {
        setErrorMessage(error.message || 'Unable to delete the account.');
        setIsDeleting(false);
      }
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const { full_name, school, year_level, department, course } = editValues;
      const updated = await updateProfile(user.id, { full_name, school, year_level, department, course });
      onSaveProfile?.(updated);
      setSuccessMessage('Profile updated.');
      onViewChange?.('profile');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const profilePageHeading = (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.2rem' }}>
        <ShieldCheck size={16} /> <span>Student Identity & Account</span>
      </div>
      <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text-main)', margin: 0 }}>{view === 'settings' ? 'Settings' : view === 'edit' ? 'Edit Profile' : 'Profile'}</h1>
    </div>
  );

  if (view === 'edit') {
    return (
      <div className="profile-page-view animate-fade-in">
        {profilePageHeading}
        {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
        <form onSubmit={handleSaveProfile} style={{ maxWidth: '680px', display: 'grid', gap: '1rem' }}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={editValues.full_name} onChange={(event) => setEditValues({ ...editValues, full_name: event.target.value })} required /></div>
          <div className="form-group"><label className="form-label">School / University</label><input className="form-input" value={editValues.school} onChange={(event) => setEditValues({ ...editValues, school: event.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Year Level</label><select className="form-select" value={editValues.year_level} onChange={(event) => setEditValues({ ...editValues, year_level: event.target.value })}>{['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'].map((year) => <option key={year}>{year}</option>)}</select></div>
          <div className="form-group"><label className="form-label">College / Department</label><input className="form-input" value={editValues.department} onChange={(event) => setEditValues({ ...editValues, department: event.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Degree Program / Course</label><input className="form-input" value={editValues.course} onChange={(event) => setEditValues({ ...editValues, course: event.target.value })} required /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => onViewChange?.('profile')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="profile-page-view animate-fade-in">
        {profilePageHeading}
        {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
        <section style={{ maxWidth: '680px', borderBottom: '1px solid var(--color-border)', padding: '1rem 0' }}>
          <h2 style={{ fontSize: '1.05rem' }}>Account</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Signed in as {user.email}</p>
          <button className="btn btn-secondary" onClick={onLogOut}><LogOut size={16} /> Sign Out</button>
        </section>
        <section style={{ maxWidth: '680px', marginTop: '1.5rem', padding: '1rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5' }}>
          <h2 style={{ fontSize: '1.05rem', color: '#991b1b' }}>Danger Zone</h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.88rem' }}>Permanently delete your account, profile, events, and attendance data.</p>
          <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={() => setShowDeleteModal(true)}><Trash2 size={16} /> Delete Account</button>
        </section>
        <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => onViewChange?.('profile')}>Back to Profile</button>
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
            <div className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem' }}>
              <h2 id="delete-account-title">Delete account permanently?</h2>
              <p>This permanently removes your account and its records. This cannot be undone.</p>
              {errorMessage && <div role="alert" style={{ color: '#b91c1c' }}>{errorMessage}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</button>
                <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Confirm delete'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
            className="btn btn-ghost"
            style={{ padding: '0.65rem 1rem', fontSize: '0.88rem' }}
            onClick={() => onViewChange?.('settings')}
            title="Account Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {successMessage && <div role="status" style={{ marginBottom: '1rem', color: '#166534' }}>{successMessage}</div>}

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

    </div>
  );
}
