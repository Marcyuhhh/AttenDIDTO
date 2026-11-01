import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getAllProfiles, recordAttendance } from '../supabaseClient';
import { sound } from '../audioEffects';

function ParticipantScannerModal({ event, currentUser, profiles = [], onClose, onAttendanceRecorded }) {
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'duplicate' | 'error', message, participant, time }
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const isCooldownRef = useRef(false);
  const isLocalDemo = !import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL;

  const allProfiles = useMemo(() => profiles.length ? profiles : getAllProfiles(), [profiles]);

  const processQRCode = useCallback(async (decodedText) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;

    let matchedParticipant = isLocalDemo ? allProfiles.find(
      (profile) => profile.qr_pass_code?.trim().toUpperCase() === decodedText?.trim().toUpperCase()
    ) : { qr_pass_code: decodedText };

    if (!matchedParticipant) {
      sound.playError();
      setScanResult({
        type: 'error',
        message: `Unrecognized QR Code (${decodedText}). Not registered in attendIDto.`,
      });
      setTimeout(() => {
        setScanResult(null);
        isCooldownRef.current = false;
      }, 2500);
      return;
    }

    let result;
    try {
      result = await recordAttendance({
        event_id: event.id,
        participant_id: matchedParticipant.id,
        participant_qr: decodedText,
        scanned_by_user_id: currentUser.id,
        scanner_device: 'Camera Scanner 1',
      });
      if (result.success && result.participant) matchedParticipant = result.participant;
    } catch (error) {
      result = { success: false, isDuplicate: false, message: error.message || 'Attendance could not be recorded.' };
    }

    if (result.success) {
      sound.playSuccess();
      setScanResult({
        type: 'success',
        message: 'Check-in Verified!',
        participant: matchedParticipant,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      if (onAttendanceRecorded) {
        onAttendanceRecorded(result.record, matchedParticipant);
      }
    } else if (result.isDuplicate) {
      sound.playDuplicate();
      setScanResult({
        type: 'duplicate',
        message: result.message,
        participant: matchedParticipant,
      });
    } else {
      sound.playError();
      setScanResult({ type: 'error', message: result.message });
    }

    setTimeout(() => {
      setScanResult(null);
      isCooldownRef.current = false;
    }, 2200);
  }, [allProfiles, currentUser.id, event.id, onAttendanceRecorded]);

  // Start HTML5 Camera Scanner
  useEffect(() => {
    let html5QrCode = null;
    const scannerId = 'reader-camera-stream';

    const startCamera = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 320, height: 320 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            processQRCode(decodedText);
          },
          () => {
            // ignore scan failure frames
          }
        );
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Camera failed to start (permission or headless device):', err);
        setCameraError('Camera access unavailable or blocked. You can still test with the quick simulation menu below.');
        setIsCameraActive(false);
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [processQRCode]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        
        {/* Scanner Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-primary)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Camera size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', lineHeight: 1.2 }}>Sign in a Participant</h3>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Scanner Viewport Box */}
        <div style={{ padding: '1.25rem' }}>
          <div className="scanner-viewport-box">
            <div id="reader-camera-stream" style={{ width: '100%', height: '100%' }}></div>
            
            {/* Visual HUD Guide Lines */}
            <div className="scanner-overlay-brackets"></div>
            <div className="scanner-laser"></div>

            {/* Error Message if Camera is Blocked */}
            {cameraError && !isCameraActive && (
              <div style={{ position: 'absolute', inset: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', color: '#ffffff' }}>
                <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '0.6rem' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Camera Not Active
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '300px' }}>
                  {cameraError}
                </div>
              </div>
            )}

            {/* Live Scan Result Overlay */}
            {scanResult && (
              <div style={{
                position: 'absolute',
                inset: '12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem',
                textAlign: 'center',
                backdropFilter: 'blur(8px)',
                background: scanResult.type === 'success' 
                  ? 'rgba(16, 185, 129, 0.95)' 
                  : scanResult.type === 'duplicate' 
                    ? 'rgba(245, 158, 11, 0.95)' 
                    : 'rgba(239, 68, 68, 0.95)',
                color: '#ffffff',
                animation: 'fadeIn 0.2s forwards',
                zIndex: 20,
              }}>
                {scanResult.type === 'success' && (
                  <>
                    <CheckCircle size={44} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>CHECK-IN VERIFIED!</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>
                      {scanResult.participant?.full_name}
                    </div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>
                      {scanResult.participant?.course} • {scanResult.participant?.year_level}
                    </div>
                    <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', marginTop: '6px' }}>
                      Time In: {scanResult.time}
                    </div>
                  </>
                )}

                {scanResult.type === 'duplicate' && (
                  <>
                    <AlertTriangle size={44} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>ALREADY CHECKED IN</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                      {scanResult.participant?.full_name}
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                      {scanResult.message}
                    </div>
                  </>
                )}

                {scanResult.type === 'error' && (
                  <>
                    <AlertOctagon size={44} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>INVALID QR CODE</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                      {scanResult.message}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Simulation Menu is available only in the local demo. */}
          {isLocalDemo && <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                ⚡ Presentation Demo Scanner:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                1-click simulation
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => processQRCode(p.qr_pass_code)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  Scan {p.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done Scanning
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ParticipantScannerModal;
