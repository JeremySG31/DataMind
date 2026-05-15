'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  register: async () => {
    throw new Error('Firebase no está configurado');
  },
  login: async () => {
    throw new Error('Firebase no está configurado');
  },
  logout: async () => {
    throw new Error('Firebase no está configurado');
  },
  isAuthenticated: false,
  isFirebaseConfigured: false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
