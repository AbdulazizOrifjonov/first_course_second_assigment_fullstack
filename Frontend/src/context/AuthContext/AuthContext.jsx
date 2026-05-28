import React, { createContext, useContext, useState } from 'react';
import { api } from '../../api';
import { setToken, getToken } from '../../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('tybt_session');
    const token = sessionStorage.getItem('tybt_token');
    if (stored && token) return JSON.parse(stored);
    sessionStorage.removeItem('tybt_session');
    sessionStorage.removeItem('tybt_token');
    return null;
  });

  const login = async (username, password) => {
    try {
      const { token, user: u } = await api.login(username, password);
      setToken(token);
      setUser(u);
      sessionStorage.setItem('tybt_session', JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('tybt_session');
    sessionStorage.removeItem('tybt_token');
  };

  const isAdmin = user?.role === 'admin';
  const isClinician = user?.role === 'clinician';
  const isReceptionist = user?.role === 'receptionist';

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isAdmin, isClinician, isReceptionist,
      canManageDoctors: isAdmin,
      canManagePatients: isAdmin || isClinician || isReceptionist,
      canManageIllnesses: isAdmin || isClinician,
      canDelete: isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
