import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub?: number;
  username?: string;
  role?: 'TENANT' | 'PROPERTY_MANAGER' | string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<JwtPayload | null>(() => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        return jwtDecode<JwtPayload>(storedToken);
      }
    } catch {
      localStorage.removeItem('token');
    }
    return null;
  });

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<JwtPayload>(token);
        setUser(decoded);
      } catch (error) {
        console.error('Failed to decode auth token', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login,
      logout,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
