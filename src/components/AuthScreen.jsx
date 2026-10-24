import React, { useState } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  signInWithPassword, 
  signUpWithPassword,
  sendPasswordReset,
} from '../supabaseClient';
import { sound } from '../audioEffects';

export default function AuthScreen({ onAuthSuccess, onGoBack }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  
  // Login & Sign Up fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student specific fields for Sign Up
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('USTP Cagayan de Oro');
  const [customSchool, setCustomSchool] = useState('');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [department, setDepartment] = useState('College of Information Technology and Computing');
  const [course, setCourse] = useState('BS in Information Technology');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const popularSchools = [
    'USTP Cagayan de Oro',
    'Xavier University - Ateneo de CDO',
    'Liceo de Cagayan University',
    'Phinma Cagayan de Oro College',
    'Capitol University',
    'Pilgrim Christian College',
    'Other / Custom Campus',
  ];

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid school or personal email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await signInWithPassword({ email, password });
    setIsLoading(false);

    if (result.success) {
      sound.playSuccess();
      if (onAuthSuccess) onAuthSuccess(result.user);
    } else {
      sound.playError();
      setErrorMsg(result.message || 'Login failed. Please check your credentials.');
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const finalSchool = school === 'Other / Custom Campus' ? customSchool.trim() : school;
    if (!finalSchool) {
      setErrorMsg('Please specify your school / campus.');
      return;
    }

    if (!department.trim()) {
      setErrorMsg('Please enter your college or department.');
      return;
    }

    if (!course.trim()) {
      setErrorMsg('Please enter your degree program / course.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const result = await signUpWithPassword({
      email,
      password,
      full_name: fullName,
      school: finalSchool,
      department,
      course,
      year_level: yearLevel,
    });
    setIsLoading(false);

    if (result.success) {
      sound.playPayment();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#1e40af', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore
      }
      if (onAuthSuccess) onAuthSuccess(result.user);
    } else {
      sound.playError();
      setErrorMsg(result.message || 'Registration failed. Please try again.');
      if (result.code === 'user_exists') {
        setMode('login');
        setPassword('');
      }
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg('');
    if (!email || !email.includes('@')) {
      setErrorMsg('Enter your account email first, then choose Forgot password.');
      return;
    }
    setIsLoading(true);
    const { error } = await sendPasswordReset(email);
    setIsLoading(false);
    setErrorMsg(error ? error.message : 'If an account exists for this email, Supabase will send a password reset message.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
      
      {/* Brand Header */}
      <header style={{ padding: '1.25rem 2rem', background: '#ffffff', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-badge">
            <QrCode size={24} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">
              attend<span>IDto</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              PRIVACY-FIRST ATTENDANCE
            </div>
          </div>
        </div>

        {onGoBack && (
          <button 
            onClick={onGoBack} 
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: mode === 'signup' ? '540px' : '440px', width: '100%', transition: 'all 0.2s ease' }}>
          
          {/* Card Container */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
            
            {/* Top Color Accent */}
            <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-gold) 100%)' }}></div>

            {/* Title & Tabs */}
            <div style={{ padding: '1.75rem 1.75rem 1rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-text-main)', marginBottom: '0.35rem', fontWeight: 800 }}>
                {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                {mode === 'login' 
                  ? 'Sign in to access your personal QR pass and campus events.'
                  : 'Register your student credentials to generate your personal QR pass.'}
              </p>

              {/* Mode Selector Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: mode === 'login' ? '#ffffff' : 'transparent',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(''); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: mode === 'signup' ? '#ffffff' : 'transparent',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: mode === 'signup' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{ margin: '0 1.75rem 1rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            {/* ══════════════════════════════════════════
                MODE: SIGN IN
                ══════════════════════════════════════════ */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ padding: '0 1.75rem 1.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="e.g. kyle.reyes@ustp.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '36px', paddingRight: '36px' }}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                    <button type="button" onClick={handlePasswordReset} disabled={isLoading} style={{ border: 0, padding: 0, background: 'transparent', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════
                MODE: CREATE ACCOUNT (SIGN UP)
                ══════════════════════════════════════════ */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} style={{ padding: '0 1.75rem 1.75rem' }}>
                
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="e.g. Maria Santos"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* School Dropdown */}
                <div className="form-group">
                  <label className="form-label">School / University *</label>
                  <div style={{ position: 'relative' }}>
                    <GraduationCap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <select
                      className="form-select"
                      style={{ paddingLeft: '36px' }}
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
                  <div className="form-group">
                    <label className="form-label">Campus Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your campus name"
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Year Level & Department Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Year Level *</label>
                    <select
                      className="form-select"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      required
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Degree Program / Course *</label>
                    <div style={{ position: 'relative' }}>
                      <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        placeholder="e.g. BS in Information Technology"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* College / Department */}
                <div className="form-group">
                  <label className="form-label">College / Department *</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="e.g. College of Information Technology and Computing"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="e.g. maria.santos@ustp.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '36px', paddingRight: '32px' }}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '36px', paddingRight: '32px' }}
                        placeholder="Re-type password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem', fontSize: '0.96rem', fontWeight: 700 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account & QR Pass...' : 'Create Account & Get QR Pass →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
