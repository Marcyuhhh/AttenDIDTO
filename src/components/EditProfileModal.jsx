import React, { useState } from 'react';
import { X, User, GraduationCap, Building2, BookOpen, Layers } from 'lucide-react';
import { updateProfile } from '../supabaseClient';

const popularSchools = [
  'USTP Cagayan de Oro',
  'Xavier University - Ateneo de CDO',
  'Liceo de Cagayan University',
  'Capitol University',
  'Pilgrim Christian College',
  'Southern Philippines College',
  'Other / Custom Campus',
];

const yearLevels = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  '6th Year',
];

export default function EditProfileModal({ currentUser, onClose, onSave }) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [school, setSchool] = useState(
    popularSchools.includes(currentUser?.school) ? currentUser?.school : 'Other / Custom Campus'
  );
  const [customSchool, setCustomSchool] = useState(
    popularSchools.includes(currentUser?.school) ? '' : (currentUser?.school || '')
  );
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [course, setCourse] = useState(currentUser?.course || '');
  const [yearLevel, setYearLevel] = useState(currentUser?.year_level || '1st Year');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    const finalSchool = school === 'Other / Custom Campus' ? customSchool.trim() : school;
    if (!finalSchool) {
      setErrorMsg('School name is required.');
      return;
    }

    if (!course.trim()) {
      setErrorMsg('Degree program / Course is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateProfile(currentUser.id, {
        full_name: fullName.trim(),
        school: finalSchool,
        department: department.trim() || 'General Department',
        course: course.trim(),
        year_level: yearLevel,
      });
      if (updated) {
        if (onSave) onSave(updated);
        onClose();
      } else {
        setErrorMsg('Failed to update profile. Please try again.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', fontWeight: 800 }}>
              Edit Profile
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Update your student credentials and campus details
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="btn-ghost" 
            style={{ padding: '6px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kyle Francis Reyes"
                required
              />
            </div>
          </div>

          {/* School */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>School / University *</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <select
                className="form-select"
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                {popularSchools.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {school === 'Other / Custom Campus' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Custom Campus Name *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.88rem' }}
                placeholder="Enter your campus name"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                required
              />
            </div>
          )}

          {/* Degree Program / Course */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Degree Program / Course *</label>
            <div style={{ position: 'relative' }}>
              <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BS in Information Technology"
                required
              />
            </div>
          </div>

          {/* Year Level & Department in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Year Level *</label>
              <div style={{ position: 'relative' }}>
                <Layers size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <select
                  className="form-select"
                  style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                >
                  {yearLevels.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>College / Department</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. CITC"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', fontWeight: 700 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
