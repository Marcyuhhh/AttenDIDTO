import React from 'react';
import { History, Calendar, Clock, MapPin, CheckCircle2, Award } from 'lucide-react';

export default function AttendanceHistory({ currentUser, attendanceRecords, events = [] }) {
  if (!currentUser) return null;

  // Find attendance records for current user
  const myAttendances = attendanceRecords
    .filter((r) => r.participant_id === currentUser.id)
    .map((record) => {
      const event = events.find((entry) => entry.id === record.event_id) || {};
      return {
        ...record,
        event_title: event.title || 'Campus Event',
        organization_name: event.organization_name || 'Student Organization',
        venue: event.venue || 'University Hall',
        event_date: event.event_date || 'Recent',
      };
    });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--color-text-main)', fontWeight: 800 }}>My Verified Check-In History</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Official digital attendance records timestamped by door scanners
          </p>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', background: '#f1f5f9', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
          {myAttendances.length} Events Attended
        </span>
      </div>

      {myAttendances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
          <Award size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>No Events Attended Yet</div>
          <div style={{ fontSize: '0.84rem', maxWidth: '400px', margin: '0.25rem auto 0' }}>
            Present your Personal QR Pass at any campus event entrance to record your verified attendance.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {myAttendances.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.1rem 0',
                borderBottom: '1px solid #f1f5f9',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {item.event_title}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} color="var(--color-primary)" /> {item.venue}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="var(--color-primary)" /> {item.event_date}
                  </span>
                </div>
              </div>

              {/* Exact Time In Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Verified Time In
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {new Date(item.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '50%', color: '#16a34a' }} title="Verified Attendance">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
