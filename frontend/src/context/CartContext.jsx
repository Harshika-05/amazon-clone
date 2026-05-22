import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import API_BASE_URL from '../config';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { showToast } = useToast();

  const fetchCart = async () => {
    if (!token) {
      setCart({ items: [] });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      if (error.response && error.response.status === 401) {
        setCart({ items: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = async (productId, quantity = 1) => {
    if (!token) return showToast('Please login to add items to cart', 'error');
    try {
      await axios.post(`${API_BASE_URL}/api/cart/items`, { productId, quantity }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
      showToast('Added to cart!', 'success');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast('Failed to add to cart', 'error');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!token) return;
    try {
      await axios.put(`${API_BASE_URL}/api/cart/items/${itemId}`, { quantity }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!token) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = () => {
    setCart({ items: [] });
  };

  const cartTotal = cart.items ? cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0) : 0;
  const cartItemCount = cart.items ? cart.items.reduce((count, item) => count + item.quantity, 0) : 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};
