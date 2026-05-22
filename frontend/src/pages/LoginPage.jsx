import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import API_BASE_URL from '../config';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, location })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error, please try again later.');
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/">
        <div className={styles.logo}>amazon<span>.in</span></div>
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        
        {error && <div className={styles.errorAlert}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
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
          
          <button type="submit" className={styles.submitBtn}>Continue</button>
        </form>
        
        <p className={styles.terms}>
          By continuing, you agree to Amazon's <Link to="#">Conditions of Use</Link> and <Link to="#">Privacy Notice</Link>.
        </p>
        
        <div className={styles.helpLinks}>
          <Link to="#">Need help?</Link>
        </div>
      </div>
      
      <div className={styles.dividerContainer}>
        <div className={styles.dividerLine}></div>
        <div className={styles.dividerText}>New to Amazon?</div>
        <div className={styles.dividerLine}></div>
      </div>
      
      <Link to="/signup" className={styles.createAccountBtn}>
        Create your Amazon account
      </Link>
    </div>
  );
};

export default LoginPage;
