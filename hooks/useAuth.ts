'use client';

import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

export interface AuthUser extends User {
  isLoading?: boolean;
  error?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios de autenticación
  useEffect(() => {
    // Verificar si hay un usuario invitado guardado localmente
    if (typeof window !== 'undefined') {
      const storedGuest = localStorage.getItem('datamind_guest_user');
      if (storedGuest) {
        try {
          setUser(JSON.parse(storedGuest));
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('datamind_guest_user');
        }
      }
    }

    if (!isFirebaseConfigured() || !auth) {
      setIsLoading(false);
      // No seteamos el error para no bloquear la UI si se desea usar modo demo
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Registro
  const register = async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase no está configurado');
    }
    try {
      setIsLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: any) {
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'Este correo ya está registrado'
          : err.code === 'auth/weak-password'
            ? 'La contraseña debe tener al menos 6 caracteres'
            : err.code === 'auth/invalid-email'
              ? 'Correo inválido'
              : err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicio de sesión
  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase no está configurado');
    }
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: any) {
      const message =
        err.code === 'auth/user-not-found'
          ? 'Usuario no encontrado'
          : err.code === 'auth/wrong-password'
            ? 'Contraseña incorrecta'
            : err.code === 'auth/invalid-email'
              ? 'Correo inválido'
              : err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar sesión como invitado (modo demo sin Firebase)
  const loginAsGuest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mockUser = {
        uid: 'guest-user-id',
        email: 'invitado@datamind.com',
        displayName: 'Invitado Especial',
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
      } as any;
      
      setUser(mockUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('datamind_guest_user', JSON.stringify(mockUser));
      }
      return mockUser;
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('datamind_guest_user');
    }
    
    if (!isFirebaseConfigured() || !auth) {
      setUser(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw new Error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    loginAsGuest,
    isAuthenticated: !!user,
    isFirebaseConfigured: isFirebaseConfigured(),
  };
}
