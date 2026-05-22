import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Account</h1>
      
      <div className={styles.cardsGrid}>
        <Link to="/orders" className={styles.card}>
          <div className={styles.iconPlaceholder}>📦</div>
          <div className={styles.cardContent}>
            <h2>Your Orders</h2>
            <p>Track, return, or buy things again</p>
          </div>
        </Link>
        
        <Link to="/wishlist" className={styles.card}>
          <div className={styles.iconPlaceholder}>❤️</div>
          <div className={styles.cardContent}>
            <h2>Your Wishlist</h2>
            <p>View and modify your saved items</p>
          </div>
        </Link>

        <div className={styles.card}>
          <div className={styles.iconPlaceholder}>🔒</div>
          <div className={styles.cardContent}>
            <h2>Login & security</h2>
            <p>Edit login, name, and mobile number</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.iconPlaceholder}>📍</div>
          <div className={styles.cardContent}>
            <h2>Your Addresses</h2>
            <p>Edit addresses for orders and gifts</p>
          </div>
        </div>
      </div>

      <div className={styles.profileDetailsSection}>
        <h2>Account Settings</h2>
        <div className={styles.detailsBox}>
          <div className={styles.detailRow}>
            <strong>Name:</strong> <span>{user.name}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Email:</strong> <span>{user.email}</span>
          </div>
          <div className={styles.detailRow}>
            <strong>Default Location:</strong> <span>{user.defaultAddress || 'Not set'}</span>
          </div>
        </div>
        
        <div className={styles.signOutWrapper}>
          <button onClick={handleSignOut} className={styles.signOutBtn}>
            Sign Out of your Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
