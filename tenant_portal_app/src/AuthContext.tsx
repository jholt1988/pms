
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      setUser(decoded);
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

  const authContextValue = {
    token,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth: any = () => { useContext(AuthContext);
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
