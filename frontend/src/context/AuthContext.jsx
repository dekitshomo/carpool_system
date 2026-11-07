import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      // If error is 401, localStorage is cleaned by api.js
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.success && data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const verifyEmail = async (verifyData) => {
    const data = await api.verifyEmail(verifyData);
    if (data.success && data.user) {
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      verifyEmail,
      logout,
      refreshUser: fetchCurrentUser,
      updateUser,
      isAuthenticated: !!token && !!user,
      isEmailVerified: user ? user.email_verified === 1 : false,
      isDriver: user?.role === 'driver',
      isPassenger: user?.role === 'passenger',
      isAdmin: user?.role === 'admin',
      isVerifiedDriver: user?.role === 'driver' && !!user?.is_verified
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

