import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: Role) => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      if (api.getToken()) {
        const { user } = await api.auth.me();
        setUser(user);
      } else {
        // Auto-login with default admin for seamless developer preview experience
        await quickLogin('ADMIN');
      }
    } catch (err) {
      console.warn('Initial session check failed, prompting login or default admin:', err);
      // Auto-fallback to admin so app is instantly usable
      await quickLogin('ADMIN');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      api.setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {}
    api.setToken(null);
    setUser(null);
  };

  const quickLogin = async (role: Role) => {
    setLoading(true);
    try {
      let email = 'admin@parxcon.com';
      let password = 'admin123';

      if (role === 'MANAGER') {
        email = 'manager@parxcon.com';
        password = 'manager123';
      } else if (role === 'EMPLOYEE') {
        email = 'faisal@parxcon.com';
        password = 'faisal123';
      }

      const res = await api.auth.login({ email, password });
      api.setToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Quick login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickLogin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
