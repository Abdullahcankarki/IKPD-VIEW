import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LoginPayload } from '../Resources';
import { fetchMyPermissions } from '../services/api';

interface AuthContextType {
  user: LoginPayload | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const isAdmin = user?.rolle === 'admin';

  const loadPermissions = useCallback(async () => {
    try {
      const perms = await fetchMyPermissions();
      setPermissions(perms);
      localStorage.setItem('permissions', JSON.stringify(perms));
    } catch {
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedPermissions = localStorage.getItem('permissions');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedPermissions) {
        setPermissions(JSON.parse(storedPermissions));
      }
    }
    setLoading(false);
  }, []);

  // Permissions nachladen wenn User eingeloggt
  useEffect(() => {
    if (token && user) {
      loadPermissions();
    }
  }, [token, user, loadPermissions]);

  const login = (newToken: string) => {
    const payload = parseJwt(newToken);
    setUser(payload);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(payload));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  };

  const parseJwt = (tkn: string): LoginPayload => {
    try {
      const base64Url = tkn.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Fehler beim Parsen des Tokens:', error);
      return { _id: '', rolle: 'Therapeut', praxisId: '' };
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  }, [isAdmin, permissions]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, loading, permissions, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
