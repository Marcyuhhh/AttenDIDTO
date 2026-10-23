import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, ShieldCheck, CheckCircle2, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveEvent } from '../supabaseClient';
import { sound } from '../audioEffects';

export default function StartEventModal({ currentUser, onClose, onEventCreated }) {
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'success'
  
  // Event details state
  const [formData, setFormData] = useState({
    title: '',
    organization_name: '',
    venue: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '17:00',
    target_attendees: 150,
    requires_time_out: false,
    description: '',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('GCash'); // 'GCash' | 'PayMaya' | 'Card'
  const [accountNumber, setAccountNumber] = useState('0917-882-9410');
  const [otpCode, setOtpCode] = useState('8492');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.venue) {
      alert('Please fill in the Event Title and Venue.');
      return;
    }
    setStep('payment');
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const refNumber = `${paymentMethod.toUpperCase()}-REF-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newEvent = saveEvent({
        ...formData,
        host_user_id: currentUser.id,
        target_attendees: Number(formData.target_attendees) || 100,
        status: 'active',
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_reference: refNumber,
        payment_amount: 49.00,
      });

      setCreatedEvent(newEvent);
      setIsProcessing(false);
      setStep('success');
      sound.playPayment();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1e40af', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore
      }
    }, 1200);
  };

  const handleFinish = () => {
    if (onEventCreated && createdEvent) {
      onEventCreated(createdEvent);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>
              {step === 'details' && 'Start a New Campus Event'}
              {step === 'payment' && 'Event Verification & Payment'}
              {step === 'success' && 'Event Published Successfully!'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {step === 'details' && 'Set up your event details and target attendees'}
              {step === 'payment' && 'Technopreneurship student-friendly event fee'}
              {step === 'success' && 'Your live attendance console is now ready for scanning'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: Event Details */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CDO Student Tech Summit 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Host Organization / Club</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. USTP SITE / Computer Society"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. USTP Gym / AVR Room 2"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">Target Attendees</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  className="form-input"
                  value={formData.target_attendees}
                  onChange={(e) => setFormData({ ...formData, target_attendees: e.target.value })}
                  required
                />
              </div>

              {/* Time Out Toggle */}
              <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_time_out}
                    onChange={(e) => setFormData({ ...formData, requires_time_out: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                  <span>Require Time-Out Scan</span>
                </label>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px', marginLeft: '22px' }}>
                  For whole-day events requiring afternoon exit scans
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="Brief event description for attendees..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-gold">
                <span>Proceed to Verification & Fee</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Technopreneurship Payment Modal */}
        {step === 'payment' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                  Technopreneurship Student Pricing
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                  Event Access Fee: ₱49.00
                </div>
                <div style={{ fontSize: '0.74rem', color: '#166534' }}>
                  Includes real-time multi-device scanning & print-ready reports
                </div>
              </div>
              <CheckCircle2 size={26} color="#16a34a" />
            </div>

            {/* Payment Method Switcher */}
            <label className="form-label">Select Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {['GCash', 'PayMaya', 'Card'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === method ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: paymentMethod === method ? 'var(--color-primary-light)' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: paymentMethod === method ? 'var(--color-primary)' : 'var(--color-text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <CreditCard size={18} />
                  <span>{method}</span>
                </button>
              ))}
            </div>

            {/* Simulated Account Prompt */}
            <div className="form-group">
              <label className="form-label">{paymentMethod} Mobile Number / Account</label>
              <input
                type="text"
                className="form-input"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Simulated 4-Digit Security Code (OTP)</label>
              <input
                type="text"
                className="form-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ letterSpacing: '0.25em', fontWeight: 700, fontSize: '1.1rem' }}
              />
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                * Ready-to-demo mode: Click button below to complete simulated payment.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep('details')}>
                ← Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                style={{ minWidth: '180px' }}
              >
                {isProcessing ? 'Verifying Payment...' : `Pay ₱49.00 via ${paymentMethod}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Success & Ready */}
        {step === 'success' && createdEvent && (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle2 size={38} color="#16a34a" />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
              {createdEvent.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Payment confirmed via {createdEvent.payment_method}. Your event is live and ready for attendance scanning.
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', maxWidth: '380px', margin: '0 auto 1.5rem', textAlign: 'left', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Reference:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{createdEvent.payment_reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Target Attendees:</span>
                <strong>{createdEvent.target_attendees} students</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Amount Paid:</span>
                <strong style={{ color: '#16a34a' }}>₱49.00 (PAID)</strong>
              </div>
            </div>

            <button className="btn btn-emerald" onClick={handleFinish} style={{ width: '100%', maxWidth: '380px' }}>
              Open Event Console & Scanner
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
