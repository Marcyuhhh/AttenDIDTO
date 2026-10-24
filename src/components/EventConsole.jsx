import React, { useState, useMemo } from 'react';
import { Camera, Printer, CheckCircle2, Search, Calendar, MapPin } from 'lucide-react';
import { getAllProfiles, getInitials } from '../supabaseClient';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

function EventConsole({ event, attendanceRecords, profiles = [], onOpenScanner, onOpenReport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const allProfiles = useMemo(() => profiles.length ? profiles : getAllProfiles(), [profiles]);

  const eventAttendance = useMemo(
    () =>
      attendanceRecords
        .filter((record) => record.event_id === event.id)
        .map((record) => {
          const student = allProfiles.find((profile) => profile.id === record.participant_id) || {};
          return {
            ...record,
            full_name: student.full_name || 'Registered Student',
            school: student.school || 'Campus',
            department: student.department || 'N/A',
            course: student.course || 'N/A',
            year_level: student.year_level || 'N/A',
            profile_picture_url: student.profile_picture_url,
          };
        }),
    [allProfiles, attendanceRecords, event.id]
  );

  const targetCount = event.target_attendees || 100;
  const currentCount = eventAttendance.length;
  const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const remainingCount = Math.max(0, targetCount - currentCount);

  const departments = useMemo(
    () => Array.from(new Set(eventAttendance.map((record) => record.department).filter(Boolean))),
    [eventAttendance]
  );

  const filteredAttendance = useMemo(
    () =>
      eventAttendance.filter((record) => {
        const matchesSearch = record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.course.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'ALL' || record.department === selectedDept;
        const matchesYear = selectedYear === 'ALL' || record.year_level === selectedYear;
        return matchesSearch && matchesDept && matchesYear;
      }),
    [eventAttendance, searchTerm, selectedDept, selectedYear]
  );

  if (!event) return null;

  return (
    <div style={{ width: '100%' }}>
      
      {/* Event Header - Flat & Expansive */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
            Active Event Console
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text-main)', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--color-primary)" /> {event.venue}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} color="var(--color-primary)" /> {event.event_date} ({event.start_time} - {event.end_time})
            </span>
          </div>
        </div>

        {/* Core Action Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <button
            id="btn-sign-in-participant"
            className="btn btn-emerald"
            onClick={onOpenScanner}
            style={{ padding: '0.8rem 1.6rem', fontSize: '0.96rem', fontWeight: 700 }}
          >
            <Camera size={20} />
            <span>Sign in a Participant</span>
          </button>

          <button
            id="btn-open-report"
            className="btn btn-secondary"
            onClick={onOpenReport}
            style={{ padding: '0.8rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Printer size={18} />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Real-time Attendance Progress Stats - Flat 3-column Grid spanning 100% */}
      <div className="flat-stats-grid">
        <div className="flat-stat-item">
          <div className="flat-stat-label">Target Attendees</div>
          <div className="flat-stat-value">{targetCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Venue capacity benchmark</div>
        </div>

        <div className="flat-stat-item">
          <div className="flat-stat-label" style={{ color: '#059669' }}>Current Attendance</div>
          <div className="flat-stat-value" style={{ color: '#059669' }}>{currentCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Total checked-in participants</div>
        </div>

        <div className="flat-stat-item">
          <div className="flat-stat-label" style={{ color: '#b45309' }}>Progress Rate</div>
          <div className="flat-stat-value" style={{ color: '#b45309' }}>{progressPercent}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{remainingCount} attendees remaining</div>
        </div>
      </div>

      {/* Live Animated Progress Bar spanning 100% full width */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--color-text-main)' }}>Live Goal Progress</span>
          <span style={{ color: 'var(--color-primary)' }}>{currentCount} of {targetCount} Checked In ({progressPercent}%)</span>
        </div>
        <div className="progress-track" style={{ height: '14px' }}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Categorized Attendance List Controls */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>Live Attendance Roster</span>
          <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '3px 10px', borderRadius: 'var(--radius-full)', color: '#475569', fontWeight: 700 }}>
            {filteredAttendance.length} Checked In
          </span>
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search participant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.86rem', width: '220px' }}
            />
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.86rem', width: 'auto' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Year Level Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.86rem', width: 'auto' }}
          >
            <option value="ALL">All Year Levels</option>
            {YEAR_LEVELS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flat Attendance Table - 100% Full Width */}
      <div style={{ width: '100%', overflowX: 'auto', borderBottom: '1px solid var(--color-border)' }}>
        <table className="flat-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Course &amp; Year</th>
              <th>Department</th>
              <th>Time In</th>
              <th>Device</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                    No check-ins recorded yet
                  </div>
                  <div style={{ fontSize: '0.86rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                    Click <strong>"Sign in a Participant"</strong> to launch the scanner and begin scanning student QR codes in real time.
                  </div>
                  <button className="btn btn-emerald" onClick={onOpenScanner} style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                    <Camera size={16} />
                    <span>Launch Camera Scanner</span>
                  </button>
                </td>
              </tr>
            ) : (
              filteredAttendance.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        className="avatar-initials" 
                        style={{ width: '34px', height: '34px', fontSize: '0.82rem', background: '#2563eb' }}
                      >
                        {getInitials(item.full_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{item.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.school}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {item.course} <span style={{ color: '#64748b', fontWeight: 400 }}>({item.year_level})</span>
                  </td>
                  <td style={{ color: '#475569', fontSize: '0.82rem' }}>
                    {item.department}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {new Date(item.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {item.scanner_device || 'Door Scanner'}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.76rem', fontWeight: 700 }}>
                      <CheckCircle2 size={13} /> Present
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default EventConsole;
