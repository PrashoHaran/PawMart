import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { apiRequest, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'pawmart_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setRestoring(false);
      return;
    }
    apiRequest('/auth/me', { token })
      .then(({ data }) => setUser(data.user))
      .catch(() => clearSession())
      .finally(() => setRestoring(false));
  }, [token, clearSession]);

  const value = useMemo(() => {
    const startSession = ({ user: nextUser, token: nextToken }) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
    };

    const register = async (name, email, password) => {
      const { data } = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      startSession(data);
    };

    const login = async (email, password) => {
      const { data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      startSession(data);
    };

    const logout = () => clearSession();

    return { user, token, restoring, register, login, logout };
  }, [user, token, restoring, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
