import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, token]);

  // Get emailPreviewUrl from sessionStorage (set during checkout)
  const emailPreviewUrl = sessionStorage.getItem('emailPreviewUrl');

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      {/* Success Card */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #007600, #00a650)', 
          padding: '30px', 
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>✓</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '5px' }}>
            Order Placed, Thank You!
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Confirmation has been sent to your email.
          </div>
        </div>

        <div style={{ padding: '25px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: '#565959', fontSize: '14px' }}>Order Number:</span>
            <strong style={{ color: '#0F1111', fontSize: '14px' }}>{id}</strong>
          </div>

          {order && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#565959', fontSize: '14px' }}>Shipping To:</span>
                <strong style={{ color: '#0F1111', fontSize: '14px' }}>{order.shippingAddress}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#565959', fontSize: '14px' }}>Order Total:</span>
                <strong style={{ color: '#B12704', fontSize: '18px' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong>
              </div>

              {/* Items */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#0F1111' }}>Items Ordered</h3>
                {order.items?.map((item) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '8px 0',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    <img 
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'} 
                      alt={item.product?.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#f8f8f8', borderRadius: '4px' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#0F1111' }}>{item.product?.name}</div>
                      <div style={{ fontSize: '12px', color: '#565959' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>₹{Number(item.priceAtPurchase).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#565959' }}>Loading order details...</div>}
        </div>
      </div>

      {/* Email Preview Card */}
      {emailPreviewUrl && (
        <div style={{ 
          backgroundColor: '#FFF8E1', 
          border: '1px solid #FFD814',
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#0F1111' }}>
            📧 Order Confirmation Email Sent!
          </div>
          <div style={{ fontSize: '13px', color: '#565959', marginBottom: '12px' }}>
            Using Ethereal test email — click below to preview the email:
          </div>
          <a 
            href={emailPreviewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-block',
              backgroundColor: '#131921', 
              color: 'white', 
              padding: '10px 24px', 
              textDecoration: 'none', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            View Email Preview →
          </a>
        </div>
      )}

      {/* Continue Shopping */}
      <div style={{ textAlign: 'center' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-block',
            backgroundColor: '#FFD814', 
            color: '#0F1111', 
            padding: '12px 30px', 
            textDecoration: 'none', 
            borderRadius: '20px',
            border: '1px solid #FCD200',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
