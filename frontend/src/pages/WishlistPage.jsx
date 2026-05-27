import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './WishlistPage.module.css';

const WishlistPage = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return <div className={styles.loading}>Loading your wishlist...</div>;
  }

  // move from wishlist to cart in one click
  const handleMoveToCart = async (productId) => {
    await addToCart(productId, 1);
    await removeFromWishlist(productId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link to="/profile">Your Account</Link> › <span>Your Wishlist</span>
      </div>

      <div className={styles.header}>
        <h1>Your Wishlist</h1>
      </div>

      {(!wishlist || !wishlist.items || wishlist.items.length === 0) ? (
        <div className={styles.emptyState}>
          <p>Your wishlist is currently empty.</p>
          <Link to="/" className={styles.continueBtn}>Continue Shopping</Link>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {wishlist.items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemImageContainer}>
                <Link to={`/product/${item.productId}`}>
                  <img 
                    src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'} 
                    alt={item.product?.name} 
                    className={styles.itemImage}
                  />
                </Link>
              </div>
              <div className={styles.itemDetails}>
                <Link to={`/product/${item.productId}`} className={styles.itemName}>
                  {item.product?.name}
                </Link>
                <div className={styles.itemPrice}>
                  ₹{Number(item.product?.price).toLocaleString('en-IN')}
                </div>
                <div className={styles.itemStock}>
                  {item.product?.stock > 0 ? 'In stock' : 'Out of stock'}
                </div>
                <div className={styles.itemActions}>
                  <button 
                    className={styles.addToCartBtn} 
                    onClick={() => handleMoveToCart(item.productId)}
                    disabled={item.product?.stock === 0}
                  >
                    Move to Cart
                  </button>
                  <button 
                    className={styles.removeBtn} 
                    onClick={() => removeFromWishlist(item.productId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
