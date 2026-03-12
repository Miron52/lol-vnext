'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { API_PREFIX, type UserProfile, type LoginResponse } from '@lol/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function clearAuth() {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lol_token');
    }
  }

  const fetchMe = useCallback(async (jwt: string) => {
    try {
      const res = await fetch(`${API_URL}${API_PREFIX}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const profile: UserProfile = await res.json();
        setUser(profile);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }, []);

  // Restore token from memory on mount (sessionStorage-like via state)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem('lol_token') : null;
    if (stored) {
      setToken(stored);
      fetchMe(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Login failed');
    }

    const data: LoginResponse = await res.json();
    setToken(data.accessToken);
    setUser(data.user);
    window.sessionStorage.setItem('lol_token', data.accessToken);
  }, []);

  /**
   * v1 behavior: logout is client-side only (clears token from sessionStorage).
   * The JWT remains technically valid until it expires (JWT_EXPIRES_IN).
   * Server-side token revocation (blocklist / refresh-token rotation) is out of
   * scope for the current ticket and should be added before production rollout.
   */
  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
