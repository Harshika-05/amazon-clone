import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.backToTop} onClick={scrollToTop}>
        Back to top
      </div>
      
      <div className={styles.footerLinksContainer}>
        <div className={styles.footerLinksRow}>
          <div className={styles.footerLinkCol}>
            <h3>Get to Know Us</h3>
            <ul>
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Press Releases</Link></li>
              <li><Link to="/">Amazon Science</Link></li>
            </ul>
          </div>
          <div className={styles.footerLinkCol}>
            <h3>Connect with Us</h3>
            <ul>
              <li><Link to="/">Facebook</Link></li>
              <li><Link to="/">Twitter</Link></li>
              <li><Link to="/">Instagram</Link></li>
            </ul>
          </div>
          <div className={styles.footerLinkCol}>
            <h3>Make Money with Us</h3>
            <ul>
              <li><Link to="/">Sell on Amazon</Link></li>
              <li><Link to="/">Sell under Amazon Accelerator</Link></li>
              <li><Link to="/">Protect and Build Your Brand</Link></li>
              <li><Link to="/">Amazon Global Selling</Link></li>
              <li><Link to="/">Become an Affiliate</Link></li>
              <li><Link to="/">Fulfilment by Amazon</Link></li>
            </ul>
          </div>
          <div className={styles.footerLinkCol}>
            <h3>Let Us Help You</h3>
            <ul>
              <li><Link to="/">COVID-19 and Amazon</Link></li>
              <li><Link to="/">Your Account</Link></li>
              <li><Link to="/">Returns Centre</Link></li>
              <li><Link to="/">100% Purchase Protection</Link></li>
              <li><Link to="/">Amazon App Download</Link></li>
              <li><Link to="/">Help</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerLogoContainer}>
          <div className={styles.logo}>amazon<span>.in</span></div>
        </div>
        <div className={styles.footerCountries}>
          <Link to="/">Australia</Link>
          <Link to="/">Brazil</Link>
          <Link to="/">Canada</Link>
          <Link to="/">China</Link>
          <Link to="/">France</Link>
          <Link to="/">Germany</Link>
          <Link to="/">Italy</Link>
          <Link to="/">Japan</Link>
          <Link to="/">Mexico</Link>
          <Link to="/">Netherlands</Link>
          <Link to="/">Poland</Link>
          <Link to="/">Singapore</Link>
          <Link to="/">Spain</Link>
          <Link to="/">Turkey</Link>
          <Link to="/">United Arab Emirates</Link>
          <Link to="/">United Kingdom</Link>
          <Link to="/">United States</Link>
        </div>
        <div className={styles.footerCopyright}>
          <span>Conditions of Use & Sale</span>
          <span>Privacy Notice</span>
          <span>Interest-Based Ads</span>
          <br />
          <span>© 1996-2024, Amazon.com, Inc. or its affiliates</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
