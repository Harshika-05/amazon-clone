import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './CartPage.module.css';

const CartPage = () => {
  // grab all cart state and actions from the global context
  const { cart, updateQuantity, removeFromCart, cartTotal, cartItemCount } = useCart();
  const navigate = useNavigate();

  // empty cart — show placeholder image
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCart}>
          <img 
            src="https://m.media-amazon.com/images/G/31/cart/empty/kettle-desaturated._CB424694257_.svg" 
            alt="Empty Cart" 
            style={{ width: '300px', marginBottom: '20px' }} 
          />
          <h2>Your Amazon Cart is empty.</h2>
          <Link to="/" style={{ color: 'var(--amazon-link)', textDecoration: 'none' }}>Shop today's deals</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cartList}>
        <h1 className={styles.title}>Shopping Cart</h1>
        <div className={styles.divider}></div>

        {/* map over all items and render a row for each */}
        {cart.items.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <img 
              src={item.product.images[0]?.url || 'https://via.placeholder.com/150'} 
              alt={item.product.name} 
              className={styles.itemImage} 
            />
            
            <div className={styles.itemDetails}>
              <Link to={`/product/${item.product.id}`} className={styles.itemName}>
                {item.product.name}
              </Link>
              <div className={styles.itemPrice}>
                ₹{item.product.price.toLocaleString('en-IN')}
              </div>
              
              {/* update item qty, min 1 */}
              <div className={styles.itemActions}>
                {/* dropdown to change quantity (1-10) */}
                <select 
                  className={styles.quantitySelect}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                >
                  {[...Array(10).keys()].map(x => (
                    <option key={x + 1} value={x + 1}>Qty: {x + 1}</option>
                  ))}
                </select>
                <div style={{color: 'var(--amazon-border)'}}>|</div>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => removeFromCart(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* cart total + checkout cta */}
      <div className={styles.summary}>
        <div className={styles.subtotal}>
          Subtotal ({cartItemCount} item{cartItemCount !== 1 ? 's' : ''}): 
          <strong> ₹{cartTotal.toLocaleString('en-IN')}</strong>
        </div>
        <button 
          className={styles.checkoutBtn}
          onClick={() => navigate('/checkout')}
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
