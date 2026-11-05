import React from 'react';
import { 
  QrCode, 
  Camera, 
  Users, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';

export default function LandingPage({ onGoToAuth }) {

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">

      {/* ─── Landing Navbar ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-badge">
              <QrCode size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-text">attend<span>IDto</span></div>
            </div>
          </div>

          <div className="landing-nav-links">
            <button onClick={() => scrollTo('features')} className="landing-nav-link">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="landing-nav-link">How It Works</button>
            <button onClick={() => scrollTo('about')} className="landing-nav-link">About</button>
          </div>

          <button className="btn btn-primary" onClick={onGoToAuth} style={{ padding: '0.55rem 1.25rem' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <div className="landing-hero-badge">
              <Sparkles size={14} color="var(--color-gold)" />
              <span>Technopreneurship Innovation Project</span>
            </div>

            <h1 className="landing-hero-title">
              Paperless, Privacy-First <br />
              <span className="landing-hero-accent">Campus Event Attendance</span>
            </h1>

            <p className="landing-hero-subtitle">
              Replace messy sign-in sheets and fragmented spreadsheets with a real-time, 
              browser-based QR attendance system. No app downloads. No student ID numbers exposed. 
              Just scan and go.
            </p>

            <div className="landing-hero-actions">
              <button className="btn btn-gold" onClick={onGoToAuth} style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                Get Started Free
                <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => scrollTo('features')} style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Learn More
              </button>
            </div>

            <div className="landing-hero-trust">
              <CheckCircle2 size={15} color="var(--color-success)" />
              <span>Used by student organizations across Cagayan de Oro campuses</span>
            </div>
          </div>

          {/* Hero Visual — Stylized QR Pass Preview */}
          <div className="landing-hero-visual">
            <div className="landing-hero-card">
              <div className="landing-hero-card-accent"></div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={13} color="var(--color-gold)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>STUDENT'S QR PASS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Kyle Francis Reyes</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>USTP Cagayan de Oro</div>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={22} color="#fff" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Year</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>3rd Year</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Course</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>BSIT</div>
                  </div>
                </div>
                {/* Fake QR grid pattern */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '120px', height: '120px', background: 'repeating-conic-gradient(var(--color-primary) 0% 25%, transparent 0% 50%) 50% / 12px 12px', borderRadius: 'var(--radius-sm)', border: '2px dashed rgba(30, 64, 175, 0.2)', padding: '6px', opacity: 0.85 }}></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.65rem' }}>
                  <code style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>AID-PASS-8849201A</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', marginTop: '0.5rem', color: '#16a34a', fontSize: '0.72rem', fontWeight: 600 }}>
                  <ShieldCheck size={12} />
                  <span>School ID Protected</span>
                </div>
              </div>
            </div>

            {/* Floating Stats Bubble */}
            <div className="landing-float-stat" style={{ top: '8%', right: '-12px' }}>
              <BarChart3 size={16} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>325 / 500</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Live Attendance</div>
              </div>
            </div>

            <div className="landing-float-stat" style={{ bottom: '12%', left: '-20px' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>✓ Check-in Verified</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Time In: 10:42 AM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <div className="landing-section-label">Features</div>
            <h2 className="landing-section-title">Everything Campus Orgs Need</h2>
            <p className="landing-section-desc">Built specifically for Philippine student organizations running events, seminars, and general assemblies.</p>
          </div>

          <div className="landing-features-grid">
            {[
              {
                icon: <QrCode size={28} />,
                color: 'var(--color-primary)',
                bg: 'var(--color-primary-light)',
                title: 'Personal QR Pass',
                desc: 'Every student gets a unique, privacy-first digital QR pass. No school ID numbers displayed — ever.',
              },
              {
                icon: <Camera size={28} />,
                color: 'var(--color-gold)',
                bg: 'var(--color-gold-light)',
                title: 'In-Browser Camera Scanner',
                desc: 'Scan participants using your phone camera directly in the browser. Zero app downloads required.',
              },
              {
                icon: <Users size={28} />,
                color: '#8b5cf6',
                bg: '#f5f3ff',
                title: 'Multi-Device Real-Time Sync',
                desc: 'Multiple officers scan at different doors simultaneously. All data feeds into one centralized database instantly.',
              },
              {
                icon: <BarChart3 size={28} />,
                color: '#059669',
                bg: '#ecfdf5',
                title: 'Live Attendance HUD',
                desc: 'Track target vs actual attendees with real-time progress bars and counters updating across all devices.',
              },
              {
                icon: <Printer size={28} />,
                color: '#dc2626',
                bg: '#fef2f2',
                title: 'Print-Ready Reports',
                desc: 'Generate official university attendance sheets with formal signature blocks. One-click Print / PDF / CSV.',
              },
              {
                icon: <Smartphone size={28} />,
                color: '#0891b2',
                bg: '#ecfeff',
                title: 'GCash & Maya Checkout',
                desc: 'GCash event packages: ₱300 for 1 event or ₱500 for 2 events.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ background: feature.bg, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <div className="landing-section-label">How It Works</div>
            <h2 className="landing-section-title">Three Simple Steps</h2>
            <p className="landing-section-desc">From sign-up to printing your official attendance report — in minutes.</p>
          </div>

          <div className="landing-steps">
            {[
              {
                num: '1',
                title: 'Sign Up & Get Your QR Pass',
                desc: 'Create your unified account with your school email. Verify via 6-digit OTP. Your personal, privacy-compliant QR pass is generated instantly.',
                icon: <QrCode size={24} color="var(--color-primary)" />,
              },
              {
                num: '2',
                title: 'Start an Event & Scan Participants',
                desc: 'Create your campus event in seconds. Open the camera scanner on your phone and scan each participant\'s QR pass at the door.',
                icon: <Camera size={24} color="var(--color-gold)" />,
              },
              {
                num: '3',
                title: 'Track Progress & Print Reports',
                desc: 'Watch your live attendance HUD update in real time. When the event ends, generate and print your categorized university report.',
                icon: <Printer size={24} color="#059669" />,
              },
            ].map((step, idx) => (
              <div key={idx} className="landing-step-card">
                <div className="landing-step-number">{step.num}</div>
                <div className="landing-step-icon">{step.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn btn-gold" onClick={onGoToAuth} style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem' }}>
              Start Using attendIDto
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── About / Footer ─── */}
      <footer className="landing-footer" id="about">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div className="logo-badge" style={{ width: '36px', height: '36px' }}>
                <QrCode size={18} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div className="logo-text" style={{ fontSize: '1.3rem' }}>attend<span>IDto</span></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '380px' }}>
              A Technopreneurship final project built for student organizations and universities 
              in Cagayan de Oro City and across regional campuses. Privacy-first, paperless, 
              and real-time.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.65rem' }}>Product</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <li><button onClick={() => scrollTo('features')} className="landing-footer-link">Features</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="landing-footer-link">How It Works</button></li>
              <li><button onClick={onGoToAuth} className="landing-footer-link">Sign In / Sign Up</button></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.65rem' }}>Compliance</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: '#94a3b8' }}>
                <ShieldCheck size={14} color="#10b981" /> No Student ID Numbers
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: '#94a3b8' }}>
                <Zap size={14} color="var(--color-gold)" /> Passwordless OTP Auth
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: '#94a3b8' }}>
                <Globe size={14} color="var(--color-primary)" /> Works on Any Browser
              </li>
            </ul>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© 2026 attendIDto — Technopreneurship Final Project</span>
          <span>Cagayan de Oro Campus Network</span>
        </div>
      </footer>

    </div>
  );
}
