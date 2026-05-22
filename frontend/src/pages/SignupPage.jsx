import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import API_BASE_URL from '../config';

const STEPS = { DETAILS: 'details', OTP: 'otp' };

const SignupPage = () => {
  const [step, setStep] = useState(STEPS.DETAILS);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(STEPS.OTP);
        
        if (data.devOtp) {
          // Render blocked the email, so we show the Dev OTP directly
          setInfo(`Email blocked by Render Firewall. Your test OTP is: ${data.devOtp}`);
          setOtp(data.devOtp.split(''));
        } else {
          setInfo(`OTP sent to ${email}`);
        }
        
        setPreviewUrl(data.previewUrl || '');
        startResendTimer();
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) return setError('Please enter the complete 6-digit OTP.');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, location, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input: auto-advance on digit entry ────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Resend timer ──────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(['', '', '', '', '', '']);
        setInfo('A new OTP has been sent.');
        setPreviewUrl(data.previewUrl || '');
        startResendTimer();
        otpRefs.current[0]?.focus();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/">
        <div className={styles.logo}>amazon<span>.in</span></div>
      </Link>

      <div className={styles.card}>
        {/* ── Step 1: Account Details ── */}
        {step === STEPS.DETAILS && (
          <>
            <h1 className={styles.title}>Create Account</h1>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Your name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
                <div className={styles.inputInfo}><i>i</i> Passwords must be at least 6 characters.</div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="location">City / Location (Optional)</label>
                <input
                  type="text"
                  id="location"
                  placeholder="e.g. Bengaluru 560001"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>

            <p className={styles.terms}>
              By creating an account, you agree to Amazon's <Link to="#">Conditions of Use</Link> and <Link to="#">Privacy Notice</Link>.
            </p>
            <div className={styles.divider} />
            <div className={styles.signInPrompt}>
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === STEPS.OTP && (
          <>
            <div className={styles.otpIcon}>📧</div>
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.otpSubtext}>
              We sent a 6-digit OTP to <strong>{email}</strong>.<br />
              Enter it below to complete your registration.
            </p>

            {error && <div className={styles.errorAlert}>{error}</div>}
            {info && <div className={styles.successAlert}>{info}</div>}

            {previewUrl && (
              <div className={styles.previewBox}>
                📨 <strong>Dev mode:</strong>{' '}
                <a href={previewUrl} target="_blank" rel="noreferrer">Preview OTP email on Ethereal</a>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.otpInputRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.otpBox}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Verifying...' : 'Create Account'}
              </button>
            </form>

            <div className={styles.resendRow}>
              {resendTimer > 0 ? (
                <span className={styles.resendTimer}>Resend OTP in {resendTimer}s</span>
              ) : (
                <button className={styles.resendBtn} onClick={handleResend} disabled={loading}>
                  Resend OTP
                </button>
              )}
            </div>

            <button className={styles.backBtn} onClick={() => { setStep(STEPS.DETAILS); setError(''); setOtp(['', '', '', '', '', '']); }}>
              ← Change email
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
