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
  QrCode,
  ChevronRight,
  ArrowLeft,
  Trash2, 
  LogOut,
} from 'lucide-react';
import { getInitials, updateProfile } from '../supabaseClient';
import { sound } from '../audioEffects';

export default function ProfileView({ user, view = 'profile', onViewChange, onOpenEditProfile, onSaveProfile, onDeleteAccount, onLogOut }) {
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

  if (view === 'qr') {
    return (
      <div className="profile-page-view animate-fade-in">
        <button className="btn btn-ghost profile-back-button" onClick={() => onViewChange?.('profile')}>
          <ArrowLeft size={17} /> Back to Profile
        </button>
        <div className="profile-page-heading">
          <h1>My QR Pass</h1>
          <p>Show this pass to an event scanner to check in.</p>
        </div>
        <section className="profile-qr-card">
          <div className="profile-qr-identity">
            <div className="avatar-initials profile-avatar">{getInitials(user.full_name)}</div>
            <div>
              <h2>{user.full_name}</h2>
              <p>{user.school}</p>
            </div>
          </div>
          <div className="profile-qr-code">
            <QRCodeSVG
              id="profile-qr-svg"
              value={user.qr_pass_code}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          </div>
          <div style={{ width: '100%', marginTop: '0.9rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Unique pass code
            </div>
            <code style={{ display: 'inline-block', padding: '0.55rem 0.8rem', borderRadius: 'var(--radius-sm)', background: '#f1f5f9', color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.04em', wordBreak: 'break-word' }}>
              {user.qr_pass_code}
            </code>
          </div>
          <p className="profile-qr-help">Use this code when an event creator adds you as a co-scanner. Keep it private.</p>
          <button className="btn btn-primary profile-qr-download" onClick={handleDownloadPass}>
            <Download size={17} /> Save Pass to Photos
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="profile-page-view animate-fade-in">
      {successMessage && <div role="status" className="profile-success-message">{successMessage}</div>}

      <div className="profile-content-grid">
        
        {/* Left: Identity & Academic Details */}
        <div className="profile-main-details">
          {/* Identity Header */}
          <div className="profile-identity">
            <div className="avatar-initials profile-avatar">
              {getInitials(user.full_name)}
            </div>
            <div className="profile-identity-copy">
              <h2>{user.full_name}</h2>
              <div className="profile-email">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div className="profile-school">
                {user.school}
              </div>
            </div>
          </div>

          {/* Academic Info Grid */}
          <div className="profile-academic-list">
            <div className="profile-academic-item">
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

            <div className="profile-academic-item">
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

            <div className="profile-academic-item">
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

          <div className="profile-action-list" aria-label="Profile actions">
            <button className="profile-action" onClick={onOpenEditProfile}>
              <span className="profile-action-icon"><UserCog size={19} /></span>
              <span><strong>Edit Profile</strong><small>Update your academic details</small></span>
              <ChevronRight size={19} />
            </button>
            <button className="profile-action" onClick={() => onViewChange?.('qr')}>
              <span className="profile-action-icon"><QrCode size={19} /></span>
              <span><strong>Show QR Code</strong><small>Open your private attendance pass</small></span>
              <ChevronRight size={19} />
            </button>
            <button className="profile-action" onClick={() => onViewChange?.('settings')}>
              <span className="profile-action-icon"><Settings size={19} /></span>
              <span><strong>Settings</strong><small>Sign out or manage your account</small></span>
              <ChevronRight size={19} />
            </button>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Student profile registered on {user.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Campus System'}
          </div>
        </div>

      </div>

    </div>
  );
}
