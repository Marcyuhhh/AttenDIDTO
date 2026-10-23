import React, { useState } from 'react';
import { X, Lock, Save, User, ShieldCheck } from 'lucide-react';
import { saveProfile, setLocalCurrentUser } from '../supabaseClient';

export default function ProfileEditModal({ currentUser, onClose, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    year_level: currentUser.year_level || '3rd Year',
    department: currentUser.department || '',
    course: currentUser.course || '',
    profile_picture_url: currentUser.profile_picture_url || '',
  });

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      ...formData,
    };
    saveProfile(updated);
    setLocalCurrentUser(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>Student Profile</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Update permitted academic information</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          
          {/* Non-Editable Information (Per PDF specification) */}
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              <Lock size={12} />
              <span>Non-Editable Identity Information</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {currentUser.full_name}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              {currentUser.school} • {currentUser.email}
            </div>
          </div>

          {/* Editable: Year Level (Options up to 6th Year) */}
          <div className="form-group">
            <label className="form-label">Year Level *</label>
            <select
              className="form-select"
              value={formData.year_level}
              onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
              required
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Editable: Department (With example format) */}
          <div className="form-group">
            <label className="form-label">Department *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. College of Information Technology and Computing (CITC)"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Format: College of [Department Name]
            </div>
          </div>

          {/* Editable: Course (With example format) */}
          <div className="form-group">
            <label className="form-label">Course *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. BS in Information Technology (BSIT)"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              required
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Format: Bachelor of Science in [Program Name]
            </div>
          </div>

          {/* Editable: Profile Picture */}
          <div className="form-group">
            <label className="form-label">Profile Picture URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.profile_picture_url}
              onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
