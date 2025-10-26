import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isUsingMock } from '../supabase';
import { MOCK_DATA } from './mockData';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

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

  // --- Real Supabase Auth Logic ---
  useEffect(() => {
    if (isUsingMock) return;

    const getInitialUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await updateUserProfile(session.user);
        }
        setLoading(false);
    };

    getInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session) {
            await updateUserProfile(session.user);
        } else {
            setUser(null);
        }
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const updateUserProfile = async (supabaseUser: SupabaseUser) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
        
      if (profile) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          fullName: profile.fullName,
          fbLink: profile.fbLink,
          role: profile.role as UserRole,
        });
      } else if (error) {
        console.error('Error fetching profile:', error);
        setUser(null); // Or handle this case more gracefully
      }
  }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (fullName: string, email: string, fbLink: string, password: string) => {
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    
    if (signUpError) {
        return { error: { message: signUpError.message } };
    }
    
    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            fullName,
            email,
            fbLink,
            role: UserRole.PARTICIPANT,
        });
        
        if (profileError) {
            console.error("Error creating profile:", profileError);
            return { error: { message: 'Registration succeeded, but failed to create user profile.' } };
        }
    }
    
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    if (!password) return { error: { message: "Password cannot be empty."}};
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? { message: error.message } : null };
  };

  // --- Mock Auth Logic ---
  useEffect(() => {
      if (!isUsingMock) return;
      // In mock mode, we just finish loading. No user is logged in by default.
      setLoading(false);
  }, []);

  const mockLogin = async (email: string, password: string): Promise<{ error: { message: string } | null }> => {
      setLoading(true);
      const admin = MOCK_DATA.users.find(u => u.role === UserRole.ADMIN);
      if (email === admin?.email && password === 'password') {
          setUser(admin);
          setLoading(false);
          return { error: null };
      }
      if (email.includes('@') && password) {
          const participantUser: User = { id: `mock-participant-${Date.now()}`, fullName: 'Mock Participant', email: email, role: UserRole.PARTICIPANT, fbLink: 'https://facebook.com/participant' };
          setUser(participantUser);
          setLoading(false);
          return { error: null };
      }
      setLoading(false);
      return { error: { message: "Invalid credentials. Use admin@cnfl.com / password, or any other email/password for a participant." } };
  };

  const mockLogout = async () => { setUser(null); };
  
  const mockRegister = async (fullName: string, email: string, fbLink: string, password: string): Promise<{ error: { message: string } | null }> => {
      setLoading(true);
      const participantUser: User = { id: `mock-participant-${Date.now()}`, fullName, email, role: UserRole.PARTICIPANT, fbLink };
      setUser(participantUser);
      setLoading(false);
      return { error: null };
  };
  
  const mockUpdatePassword = async (password: string): Promise<{ error: { message: string } | null }> => {
      if (!password) return { error: { message: "Password cannot be empty."}};
      alert("Password updated in mock mode.");
      return { error: null };
  };

  const value = isUsingMock 
    ? { user, loading, login: mockLogin, logout: mockLogout, register: mockRegister, updatePassword: mockUpdatePassword }
    : { user, loading, login, logout, register, updatePassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
