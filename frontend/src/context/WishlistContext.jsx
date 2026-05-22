import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { showToast } = useToast();

  const fetchWishlist = async () => {
    if (!token) {
      setWishlist({ items: [] });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      if (error.response && error.response.status === 401) {
        setWishlist({ items: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const addToWishlist = async (productId) => {
    if (!token) return showToast('Please login to add items to your wishlist', 'error');
    try {
      await axios.post('http://localhost:5000/api/wishlist/items', { productId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWishlist();
      showToast('Added to wishlist!', 'success');
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      showToast('Failed to add to wishlist', 'error');
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!token) return;
    try {
      await axios.delete(`http://localhost:5000/api/wishlist/items/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchWishlist();
      showToast('Removed from wishlist', 'info');
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const isInWishlist = (productId) => {
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
