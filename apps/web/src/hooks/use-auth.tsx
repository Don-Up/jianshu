'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { User } from '@jianshu/shared';
import { getUser, setUser as saveUser, setToken, clearAuth, isAuthenticated, getToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const savedUser = getUser();
        if (savedUser) {
          setUserState(savedUser);
        }
        try {
          const token = getToken();
          if (token) {
            const res = await fetch('/api/auth/me', {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success && data.data) {
              setUserState(data.data);
              saveUser(data.data);
            } else {
              clearAuth();
              setUserState(null);
            }
          }
        } catch {
          clearAuth();
          setUserState(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success && data.data) {
      setUserState(data.data.user);
      saveUser(data.data.user);
      if (data.data.token) {
        setToken(data.data.token);
      }
    } else {
      throw new Error(data.error || 'Login failed');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, username: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username }),
    });
    const data = await res.json();

    if (data.success && data.data) {
      setUserState(data.data.user);
      saveUser(data.data.user);
      if (data.data.token) {
        setToken(data.data.token);
      }
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue with local cleanup even if API fails
    }
    clearAuth();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}