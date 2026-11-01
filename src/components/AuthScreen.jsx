import React, { useState } from 'react';
import { 
  QrCode, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
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
  const [signupStep, setSignupStep] = useState(1);
  
  // Login & Sign Up fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student specific fields for Sign Up
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState('');
  const [customSchool, setCustomSchool] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');

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

  const handleSignupNext = () => {
    setErrorMsg('');
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Enter your first and last name.');
      return;
    }
    const finalSchool = school === 'Other / Custom Campus' ? customSchool.trim() : school;
    if (!finalSchool) {
      setErrorMsg('Please specify your school / campus.');
      return;
    }
    if (!yearLevel) {
      setErrorMsg('Select your year level.');
      return;
    }
    if (!course.trim() || !department.trim()) {
      setErrorMsg('Enter your degree program and college.');
      return;
    }
    setErrorMsg('');
    setSignupStep(2);
  };

  // Handle Sign Up submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
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

    const finalSchool = school === 'Other / Custom Campus' ? customSchool.trim() : school;
    setIsLoading(true);
    const result = await signUpWithPassword({
      email,
      password,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
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

  const switchToSignup = () => {
    setMode('signup');
    setSignupStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  };

  const switchToLogin = () => {
    setMode('login');
    setSignupStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  };

  return (
    <div className="auth-page">
      
      {/* Brand Header */}
      <header className="auth-header">
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
      <main className="auth-main">
        <div className={`auth-shell ${mode === 'signup' ? 'auth-shell-signup' : ''}`}>
          
          {/* Card Container */}
          <div className="auth-card">
            
            {/* Top Color Accent */}
            <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-gold) 100%)' }}></div>

            {/* Title & Tabs */}
            <div className="auth-card-heading">
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-text-main)', marginBottom: '0.35rem', fontWeight: 800 }}>
                {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
              </h2>
              <p className="auth-card-description">
                {mode === 'login' 
                  ? 'Sign in to access your personal QR pass and campus events.'
                  : signupStep === 1 ? 'Add your student information.' : 'Set up your sign-in details.'}
              </p>

              {/* Mode Selector Tabs */}
              <div className="auth-mode-tabs">
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
                  onClick={switchToSignup}
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
              <div className="auth-error-message">
                {errorMsg}
              </div>
            )}

            {/* ══════════════════════════════════════════
                MODE: SIGN IN
                ══════════════════════════════════════════ */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="auth-login-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '36px', paddingRight: '36px' }}
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                  onClick={switchToSignup}
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
              <form onSubmit={handleSignUp} className="signup-form">
                <div className="signup-step-heading">
                  <span>STEP {signupStep} OF 2</span>
                  <strong>{signupStep === 1 ? 'Student information' : 'Account details'}</strong>
                </div>

                {signupStep === 1 ? (
                  <div className="signup-fields">
                    <div className="signup-name-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="signup-first-name">First Name</label>
                        <input id="signup-first-name" type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="signup-last-name">Last Name</label>
                        <input id="signup-last-name" type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-school">School</label>
                      <select id="signup-school" className="form-select" value={school} onChange={(e) => setSchool(e.target.value)} required>
                        <option value="" disabled></option>
                        {popularSchools.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>

                    {school === 'Other / Custom Campus' && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="signup-custom-school">School Name</label>
                        <input id="signup-custom-school" type="text" className="form-input" value={customSchool} onChange={(e) => setCustomSchool(e.target.value)} required />
                      </div>
                    )}

                    <div className="signup-academic-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="signup-year-level">Year Level</label>
                        <select id="signup-year-level" className="form-select" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} required>
                          <option value="" disabled></option>
                          {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="signup-course">Program / Degree</label>
                        <input id="signup-course" type="text" className="form-input" placeholder="Ex. BSCpE, BSCE, BSIT, etc." value={course} onChange={(e) => setCourse(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-college">College</label>
                      <input id="signup-college" type="text" className="form-input" placeholder="Ex. CEA, COM, CITC, etc." value={department} onChange={(e) => setDepartment(e.target.value)} required />
                    </div>
                  </div>
                ) : (
                  <div className="signup-fields signup-account-fields">
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-email">Email</label>
                      <div className="signup-input-with-icon">
                        <Mail size={16} />
                        <input id="signup-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-password">Password</label>
                      <div className="signup-input-with-icon">
                        <Lock size={16} />
                        <input id="signup-password" type={showPassword ? 'text' : 'password'} className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
                      <div className="signup-input-with-icon">
                        <Lock size={16} />
                        <input id="signup-confirm-password" type={showConfirmPassword ? 'text' : 'password'} className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="signup-actions">
                  {signupStep === 2 && (
                    <button
                      type="button"
                      className="signup-back-button"
                      onClick={() => { setSignupStep(1); setErrorMsg(''); }}
                    >
                      Back
                    </button>
                  )}
                  {signupStep === 1 ? (
                    <button type="button" className="btn btn-primary signup-primary-action" onClick={handleSignupNext}>
                      Next
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-gold signup-primary-action" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  )}
                </div>

                <div className="signup-switch-mode">
                  Already have an account?{' '}
                  <button type="button" onClick={switchToLogin}>
                    Sign In
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
