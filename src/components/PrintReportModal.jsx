import React, { useState, useMemo } from 'react';
import { X, Printer, Download, Filter, CheckCircle2 } from 'lucide-react';
import { getAllProfiles } from '../supabaseClient';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

function PrintReportModal({ event, attendanceRecords, currentUser, profiles = [], onClose }) {
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  const allProfiles = useMemo(() => profiles.length ? profiles : getAllProfiles(), [profiles]);

  const enrichedRecords = useMemo(
    () =>
      attendanceRecords
        .filter((record) => record.event_id === event.id)
        .map((record) => {
          const student = allProfiles.find((profile) => profile.id === record.participant_id) || {};
          return {
            ...record,
            full_name: student.full_name || 'Registered Attendee',
            school: student.school || 'Campus',
            department: student.department || 'N/A',
            course: student.course || 'N/A',
            year_level: student.year_level || 'N/A',
          };
        }),
    [allProfiles, attendanceRecords, event.id]
  );

  const departments = useMemo(
    () => Array.from(new Set(enrichedRecords.map((record) => record.department).filter(Boolean))),
    [enrichedRecords]
  );

  const filteredRecords = useMemo(
    () =>
      enrichedRecords.filter((record) => {
        const matchesDept = deptFilter === 'ALL' || record.department === deptFilter;
        const matchesYear = yearFilter === 'ALL' || record.year_level === yearFilter;
        return matchesDept && matchesYear;
      }),
    [deptFilter, enrichedRecords, yearFilter]
  );

  const targetCount = event.target_attendees || 100;
  const currentCount = enrichedRecords.length;
  const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Full Name', 'School', 'Department', 'Course', 'Year Level', 'Time In', 'Time Out', 'Status'];
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.full_name}"`,
      `"${r.school}"`,
      `"${r.department}"`,
      `"${r.course}"`,
      `"${r.year_level}"`,
      `"${new Date(r.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
      `"${r.time_out ? new Date(r.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}"`,
      '"Verified Present"',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card print-page" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '850px', width: '95%', padding: '0', background: '#ffffff' }}
      >
        
        {/* Modal Toolbar (Hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>Print-Ready Attendance Report</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Official administrative university format</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar (Hidden during print) */}
        <div className="no-print" style={{ padding: '0.75rem 1.5rem', background: '#ffffff', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <Filter size={14} />
            <span>Filter Report:</span>
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Departments ({enrichedRecords.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Year Levels</option>
            {YEAR_LEVELS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Printable Official Document */}
        <div style={{ padding: '2rem' }}>
          
          {/* Institutional Document Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: 'var(--color-primary)' }}>
              OFFICIAL ATTENDANCE ROSTER &amp; EVENT REPORT
            </div>
            <h1 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '0.25rem 0' }}>
              {event.title}
            </h1>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
              {event.organization_name ? `Hosted by: ${event.organization_name}` : 'Student Organization Event'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
              Venue: {event.venue} • Date: {event.event_date} ({event.start_time} - {event.end_time})
            </div>
          </div>

          {/* Metric Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Target Attendees</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{targetCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Verified Checked In</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{currentCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Turnout Percentage</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a' }}>{progressPercent}%</div>
            </div>
          </div>

          {/* Tabular Roster */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', width: '35px' }}>#</th>
                <th style={{ padding: '8px 10px' }}>Participant Name</th>
                <th style={{ padding: '8px 10px' }}>Course &amp; Year</th>
                <th style={{ padding: '8px 10px' }}>Department</th>
                <th style={{ padding: '8px 10px' }}>Time In</th>
                {event.requires_time_out && <th style={{ padding: '8px 10px' }}>Time Out</th>}
                <th style={{ padding: '8px 10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={event.requires_time_out ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No attendance records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{r.full_name}</td>
                    <td style={{ padding: '8px 10px' }}>{r.course} ({r.year_level})</td>
                    <td style={{ padding: '8px 10px', color: '#475569', fontSize: '0.78rem' }}>{r.department}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {new Date(r.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {event.requires_time_out && (
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>
                        {r.time_out ? new Date(r.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </td>
                    )}
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Official University Signatory Block */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '35px' }}>Prepared by:</div>
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentUser.full_name}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Event Attendance Officer</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '35px' }}>Noted by:</div>
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Organization President / Officer</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Student Organization</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '35px' }}>Approved by:</div>
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Faculty Adviser / Dean</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Office of Student Affairs</div>
            </div>
          </div>

          {/* System Compliance Footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
            Generated electronically by <strong>attendIDto</strong> • Compliant with Institutional Student Privacy Rules (No Student ID Number Required)
          </div>

        </div>

      </div>
    </div>
  );
}

export default PrintReportModal;
