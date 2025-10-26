import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import * as api from '../supabase/api';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, fbLink: string, password: string) => Promise<{ error: { message: string } | null }>;
  updatePassword: (password: string) => Promise<{ error: { message: string } | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateUserProfile = async (supabaseUser: SupabaseUser | null) => {
      if (!supabaseUser) {
        setUser(null);
        return;
      }
      try {
        const { data: profile } = await api.getProfile(supabaseUser);
        if (profile) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            fullName: profile.fullName,
            fbLink: profile.fbLink,
            role: profile.role as UserRole,
          });
        } else {
            setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      }
    };

    const initializeSession = async () => {
        try {
            const { data: { session } } = await api.getSession();
            await updateUserProfile(session?.user ?? null);
        } catch (error) {
            console.error("Error initializing session:", error);
        } finally {
            setLoading(false);
        }
    };

    initializeSession();

    const { data: authListener } = api.onAuthStateChange(
      async (event: string, session: Session | null) => {
        await updateUserProfile(session?.user ?? null);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await api.signIn(email, password);
    return { error: error ? { message: error.message } : null };
  };

  const logout = async () => {
    await api.signOut();
    setUser(null);
  };

  const register = async (fullName: string, email: string, fbLink: string, password: string) => {
    try {
      await api.signUp(fullName, email, fbLink, password);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const updatePassword = async (password: string) => {
    if (!password) return { error: { message: "Password cannot be empty." } };
    const { error } = await api.updateUserPassword(password);
    return { error: error ? { message: error.message } : null };
  };

  const value = { user, loading, login, logout, register, updatePassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
