import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, UserRole, UserProfile } from '../types';
import { api, getStoredToken, setStoredToken } from '../utils/api';

interface AuthContextType {
  user: AdminUser | null;
  role: UserRole | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, keepSignedIn?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = getStoredToken();
        if (token) {
          const session = await api.verifySession();
          if (session.authenticated && session.user) {
            setUser(session.user);
          } else {
            setUser(null);
            setStoredToken(null);
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string, keepSignedIn = false) => {
    setError(null);
    try {
      const res = await api.login(emailOrUsername, password, keepSignedIn);
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStoredToken(null);
    }
  };

  const clearError = () => setError(null);

  const role: UserRole | null = user?.role || null;
  const isAdmin = role === 'admin';
  const profile: UserProfile | null = user?.profile || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profile,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
