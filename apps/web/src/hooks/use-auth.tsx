'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { User } from '@jianshu/shared';
import { authApi } from '@/lib/api';
import { getUser, setUser as saveUser, setToken, clearAuth, isAuthenticated } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => void;
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
          const res = await authApi.me();
          if (res.success && res.data) {
            setUserState(res.data);
            saveUser(res.data);
          } else {
            clearAuth();
            setUserState(null);
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
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUserState(res.data.user);
      saveUser(res.data.user);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, username: string) => {
    const res = await authApi.register({ email, password, name, username });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUserState(res.data.user);
      saveUser(res.data.user);
    } else {
      throw new Error(res.error || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
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
