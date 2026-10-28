import React, { useEffect, useState } from 'react';
import { UserPlus, X, Trash2, ShieldCheck } from 'lucide-react';
import { addEventScanner, getEventScanners, getInitials, removeEventScanner } from '../supabaseClient';

export default function CoScannerModal({ event, onClose }) {
  const [scanners, setScanners] = useState([]);
  const [scannerCode, setScannerCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    let active = true;
    getEventScanners(event.id)
      .then((data) => {
        if (active) setScanners(data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.message || 'Unable to load co-scanners.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [event.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!scannerCode.trim()) {
      setErrorMessage('Enter the co-scanner code associated with their QR pass.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const scanner = await addEventScanner(event.id, scannerCode.trim());
      setScanners((previous) => [scanner, ...previous.filter((item) => item.user_id !== scanner.user_id)]);
      setScannerCode('');
      setNotificationMessage(
        scanner.notificationWarning
          ? `Co-scanner added, but the email could not be sent: ${scanner.notificationWarning}`
          : `Co-scanner added. An email was sent to ${scanner.email}.`
      );
    } catch (error) {
      setErrorMessage(error.message || 'Unable to add this co-scanner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (scanner) => {
    setRemovingUserId(scanner.user_id);
    setErrorMessage('');
    try {
      await removeEventScanner(event.id, scanner.user_id);
      setScanners((previous) => previous.filter((item) => item.user_id !== scanner.user_id));
    } catch (error) {
      setErrorMessage(error.message || 'Unable to remove this co-scanner.');
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Co-scanners</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" aria-label="Close co-scanners panel"><X size={21} /></button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.65rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="co-scanner-code">Co-scanner code</label>
              <input
                id="co-scanner-code"
                className="form-input"
                value={scannerCode}
                onChange={(e) => setScannerCode(e.target.value)}
                placeholder="Example: AID-PASS-8849201A"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <UserPlus size={17} />
              {isSaving ? 'Adding...' : 'Add'}
            </button>
          </form>

          <p style={{ margin: '0 0 1.1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Enter the unique code printed on the person&apos;s attendIDto QR pass. They do not need to be scanned first.
          </p>

          {errorMessage && (
            <div role="alert" style={{ marginBottom: '1rem', padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.82rem' }}>
              {errorMessage}
            </div>
          )}
          {notificationMessage && (
            <div role="status" style={{ marginBottom: '1rem', padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: notificationMessage.includes('could not') ? '#fffbeb' : '#f0fdf4', border: `1px solid ${notificationMessage.includes('could not') ? '#fde68a' : '#bbf7d0'}`, color: notificationMessage.includes('could not') ? '#92400e' : '#166534', fontSize: '0.82rem' }}>
              {notificationMessage}
            </div>
          )}

          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            Assigned scanners ({scanners.length})
          </div>
          {isLoading ? (
            <div style={{ padding: '1.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>Loading co-scanners...</div>
          ) : scanners.length === 0 ? (
            <div style={{ padding: '1rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: '0.86rem', textAlign: 'center' }}>
              No co-scanners assigned yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {scanners.map((scanner) => (
                <div key={scanner.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div className="avatar-initials" style={{ width: '34px', height: '34px', fontSize: '0.78rem', background: '#2563eb' }}>
                    {getInitials(scanner.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{scanner.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scanner.email || scanner.school || 'Assigned co-scanner'}
                    </div>
                  </div>
                  <ShieldCheck size={17} color="#059669" title="Can scan this event" />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleRemove(scanner)}
                    disabled={removingUserId === scanner.user_id}
                    title={`Remove ${scanner.full_name}`}
                    aria-label={`Remove ${scanner.full_name}`}
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
