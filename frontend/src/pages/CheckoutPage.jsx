import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './CheckoutPage.module.css';
import API_BASE_URL from '../config';

const CheckoutPage = () => {
  const { cart, cartTotal, cartItemCount, clearCart } = useCart();
  const { token, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.street || !address.city || !address.zipCode) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const formattedAddress = `${address.fullName}, ${address.street}, ${address.city}, ${address.zipCode}, ${address.country}`;
      const response = await axios.post(`${API_BASE_URL}/api/orders`, {
        shippingAddress: formattedAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      clearCart();
      await fetchUser(); // Refresh user object to get the new defaultAddress

      navigate(`/order/${response.data.id}`);
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Checkout ({cartItemCount} items)</h1>
      
      <div className={styles.checkoutLayout}>
        <div className={styles.formSection}>
          <h2>Shipping address</h2>
          <div style={{ marginTop: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full name (First and Last name)</label>
              <input 
                type="text" 
                className={styles.input} 
                value={address.fullName}
                onChange={e => setAddress({...address, fullName: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Street address</label>
              <input 
                type="text" 
                className={styles.input} 
                value={address.street}
                onChange={e => setAddress({...address, street: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>City</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={address.city}
                  onChange={e => setAddress({...address, city: e.target.value})}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>ZIP Code</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={address.zipCode}
                  onChange={e => setAddress({...address, zipCode: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <input 
                type="text" 
                className={styles.input} 
                value={address.country}
                onChange={e => setAddress({...address, country: e.target.value})}
              />
            </div>
          </div>

          <h2 style={{ marginTop: '30px' }}>Review items for delivery</h2>
          <div style={{ marginTop: '15px', border: '1px solid #D5D9D9', borderRadius: '8px', padding: '20px' }}>
            {cart?.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <img 
                  src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                  alt={item.product?.name} 
                  style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                    {item.product?.name}
                  </h4>
                  <div style={{ color: '#B12704', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                    ₹{item.product?.price?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '13px', color: '#565959' }}>
                    Quantity: {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.summarySection}>
          <button 
            className={styles.placeOrderBtn}
            onClick={handlePlaceOrder}
            disabled={loading || cartItemCount === 0}
          >
            {loading ? 'Processing...' : 'Place your order'}
          </button>
          
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Items:</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Shipping & handling:</span>
            <span>₹0.00</span>
          </div>
          <div className={styles.orderTotal}>
            <span>Order total:</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
