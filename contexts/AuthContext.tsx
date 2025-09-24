import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { setMuted, playBGM, stopBGM, unlockAudio } from '../services/soundService';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  isMuted: boolean;
  showOutOfCreditsModal: boolean;
  setShowOutOfCreditsModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => Promise<void>;
  handleToggleMute: () => void;
  deductCredits: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(true); // Default to muted
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
      console.error('Error fetching profile:', error);
      setAuthError('Gagal mengambil data profil pengguna.');
    } else if (data) {
      setProfile(data as Profile);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError('Gagal mengambil sesi login.');
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // When auth state changes (e.g., token refresh on tab focus), 
        // fetch the profile in the background without triggering the main loading screen.
        // The initial load is handled by the getSession call above.
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          // If the user logs out (session becomes null), clear the profile.
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  useEffect(() => {
      setMuted(isMuted);
      if (isMuted) {
          stopBGM();
      } else if (session) {
          playBGM('main');
      } else {
          playBGM('welcome');
      }
  }, [isMuted, session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Gagal logout: ${error.message}`);
    } else {
      setProfile(null);
    }
  };

  const handleToggleMute = () => {
    unlockAudio(); // Ensure audio is unlocked when user interacts with mute button
    setIsMutedState(prev => !prev);
  };
  
  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!profile || !user) {
        setAuthError("Pengguna tidak terautentikasi untuk mengurangi kredit.");
        return false;
    }

    if (profile.credits < amount) {
        setShowOutOfCreditsModal(true);
        return false;
    }

    const newCredits = profile.credits - amount;
    const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

    if (error) {
        setAuthError(`Gagal mengurangi kredit: ${error.message}`);
        return false;
    }

    setProfile(prev => prev ? { ...prev, credits: newCredits } : null);
    return true;
  };


  const value = {
    session,
    user,
    profile,
    loading,
    authError,
    isMuted,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
    handleLogout,
    handleToggleMute,
    deductCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};