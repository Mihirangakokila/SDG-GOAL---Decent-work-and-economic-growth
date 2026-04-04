import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi, meApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async (payload) => {
    const { data } = await loginApi(payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) return null;
    const { data } = await meApi();
    setUser(data);
    return data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refreshMe,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
