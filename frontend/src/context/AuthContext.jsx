// createContext = react way to share data across components without prop drilling
// useState = store reactive data, useEffect = run code on mount/update
import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config';

// global auth state — login/logout accessible from anywhere
const AuthContext = createContext();

// shortcut hook so pages dont need to import useContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = not logged in
  // persist token across page refresh using localStorage
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // true while checking if token is valid

  // on load, check if saved token is still valid
  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // send token in Authorization header so backend knows who we are
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}` // Bearer = standard format for jwt auth
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid or expired
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect with [token] = runs every time token changes (login/logout/refresh)
  useEffect(() => {
    fetchUser();
  }, [token]);

  // save user + token to state and localStorage
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  // clear everything on logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Provider passes all auth values down to every child component via context
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
