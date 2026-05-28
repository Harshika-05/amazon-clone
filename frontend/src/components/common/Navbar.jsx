import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Link = <a> without page reload
import { Search, MapPin, ChevronDown, Menu, ShoppingCart } from 'lucide-react'; // icon library
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css'; // CSS modules = scoped class names, no global conflicts

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { cartItemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // hook to change url programmatically
  const location = useLocation(); // hook to read current url path and params
  const isFirstRender = useRef(true); // ref persists across re-renders, used to skip first debounce

  // sync search bar input with the ?search= url param when page loads
  useEffect(() => {
    if (location.pathname === '/') {
      // URLSearchParams = built-in way to parse ?key=value from url
      const params = new URLSearchParams(location.search);
      const q = params.get('search');
      if (q !== null && q !== searchQuery) {
        setSearchQuery(q);
      }
    }
  }, [location.search, location.pathname]);

  // debounce typing — wait 500ms after they stop typing before updating the url to avoid spamming navigation
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      } else if (location.pathname === '/' && location.search.includes('search=')) {
        navigate('/');
      }
    }, 500);

    // return cleanup function — clears timer if user types again before 500ms
    return () => clearTimeout(timer);
  }, [searchQuery, navigate, location.pathname, location.search]);

  // figure out what to show for the delivery location (first line)
  const formatLocationTop = () => {
    if (user && user.defaultAddress) {
      const parts = user.defaultAddress.split(',');
      if (parts.length >= 4) {
        return `Delivering to ${parts[0]}`;
      }
      return `Delivering to ${user.name}`;
    }
    if (user) return `Delivering to ${user.name}`;
    return 'Hello';
  };

  // figure out what to show for the delivery location (second line, usually city/state)
  const formatLocationBottom = () => {
    if (user && user.defaultAddress) {
      const parts = user.defaultAddress.split(',');
      if (parts.length >= 4) {
        return `${parts[2].trim()} ${parts[3].trim()}`;
      }
      return user.defaultAddress;
    }
    return 'Select your address';
  };

  // when they hit enter or click the mag glass, push the search query to the url
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.navbarContainer}>
      <nav className={styles.navbar}>
        {/* Logo */}
        <Link to="/" className={styles.logoContainer}>
          <div className={styles.logo}>amazon<span>.in</span></div>
        </Link>

        {/* Location (Desktop) */}
        <div className={styles.locationContainer}>
          <span className={styles.locTop}>{formatLocationTop()}</span>
          <span className={styles.locBottom}>
            <MapPin size={14} style={{ marginRight: '3px' }} /> {formatLocationBottom()}
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className={styles.searchContainer}>
          <select className={styles.searchDropdown}>
            <option>All</option>
            <option>Electronics</option>
            <option>Books</option>
            <option>Fashion</option>
          </select>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search Amazon.in"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            <Search size={20} color="#333" />
          </button>
        </form>

        {/* Right Links */}
        <div className={styles.navLinks}>
          <div className={styles.navLink}>
            <span>EN</span>
            <span><ChevronDown size={14} style={{ marginLeft: '2px', color: '#ccc' }}/></span>
          </div>

          <Link to={user ? "/profile" : "/login"} className={styles.navLink} style={{ textDecoration: 'none' }}>
            <span>Hello, {user ? user.name : 'Guest'}</span>
            <span>Account & Lists <ChevronDown size={14} style={{ marginLeft: '2px', color: '#ccc' }}/></span>
          </Link>

          <Link to={user ? "/orders" : "/login"} className={styles.navLink} style={{ textDecoration: 'none' }}>
            <span>Returns</span>
            <span>& Orders</span>
          </Link>

          <Link to="/cart" className={styles.cartContainer}>
            <div className={styles.cartIconWrapper}>
              <span className={styles.cartCount}>{cartItemCount}</span>
              <ShoppingCart size={36} strokeWidth={1.5} className={styles.cartIcon} />
            </div>
            <span className={styles.cartText}>Cart</span>
          </Link>
        </div>
      </nav>

      {/* Secondary Navbar */}
      <div className={styles.secondaryNav}>
        <div className={styles.secNavLink} style={{ fontWeight: 'bold' }}>
          <Menu size={18} className={styles.secMenuIcon} /> All
        </div>
        <Link to="/#category-books" className={styles.secNavLink} style={{ textDecoration: 'none', color: 'inherit' }}>Books</Link>
        <Link to="/#category-electronics" className={styles.secNavLink} style={{ textDecoration: 'none', color: 'inherit' }}>Electronics</Link>
        <Link to="/#category-fashion" className={styles.secNavLink} style={{ textDecoration: 'none', color: 'inherit' }}>Fashion</Link>
        <Link to="/#category-home-and-kitchen" className={styles.secNavLink} style={{ textDecoration: 'none', color: 'inherit' }}>Home & Kitchen</Link>
        <div className={styles.secNavLink}>Amazon miniTV</div>
        <div className={styles.secNavLink}>Sell</div>
        <div className={styles.secNavLink}>Best Sellers</div>
        <div className={styles.secNavLink}>Today's Deals</div>
      </div>
    </div>
  );
};

export default Navbar;
