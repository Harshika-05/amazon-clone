import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import API_BASE_URL from '../config';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, location })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        if (data.devOtp) {
          setInfo(`Your verification code is: ${data.devOtp}`);
          setOtp(data.devOtp);
        } else {
          setInfo('OTP sent to your email');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error, please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, location })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error, please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/">
        <div className={styles.logo}>amazon<span>.in</span></div>
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>{step === 1 ? 'Sign in' : 'Verify Email'}</h1>
        
        {error && <div className={styles.errorAlert}>{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleLoginStep1} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email or mobile phone number</label>
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
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
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
            
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.inputGroup}>
              <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                We sent a One Time Password (OTP) to your email <strong>{email}</strong>.
              </p>
              {info && <div style={{ background: '#f0fff0', border: '1px solid #007600', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#007600', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>{info}</div>}
              <label htmlFor="otp">Enter OTP</label>
              <input 
                type="text" 
                id="otp" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                maxLength="6"
                placeholder="123456"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify and Sign In'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                type="button" 
                className={styles.secondaryBtn} 
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#0066c0', cursor: 'pointer' }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
        
        {step === 1 && (
          <>
            <p className={styles.terms}>
              By continuing, you agree to Amazon's <Link to="#">Conditions of Use</Link> and <Link to="#">Privacy Notice</Link>.
            </p>
            
            <div className={styles.helpLinks}>
              <Link to="#">Need help?</Link>
            </div>
          </>
        )}
      </div>
      
      {step === 1 && (
        <>
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine}></div>
            <div className={styles.dividerText}>New to Amazon?</div>
            <div className={styles.dividerLine}></div>
          </div>
          
          <Link to="/signup" className={styles.createAccountBtn}>
            Create your Amazon account
          </Link>
        </>
      )}
    </div>
  );
};

export default LoginPage;
