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
  showLogoutConfirm: boolean;
  setShowOutOfCreditsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLogoutConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  executeLogout: () => Promise<void>;
  handleToggleMute: () => void;
  handleDeleteAccount: () => void;
  deductCredits: (amount: number) => Promise<boolean>;
  refreshProfile: () => Promise<void>; // Exposed function to refresh profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get today's date in 'YYYY-MM-DD' format for WIB (Asia/Jakarta) timezone.
const getTodaysDateWIB = (): string => {
  // 'en-CA' locale reliably gives the YYYY-MM-DD format.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for logout modal

  const fetchProfile = useCallback(async (userId: string) => {
    // Select all columns including the new storage_used_kb
    const { data, error } = await supabase
      .from('profiles')
      .select('*, storage_used_kb')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
      console.error('Error fetching profile:', error);
      setAuthError('Gagal mengambil data profil pengguna.');
      return; // Stop execution if fetching fails
    }

    if (data) {
        const todayWIB = getTodaysDateWIB();
        const profileData = data as Profile;

        // Check if the last reset was not today
        if (profileData.last_credit_reset !== todayWIB) {
            const updatedProfile = { ...profileData, credits: 10, last_credit_reset: todayWIB };
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: 10, last_credit_reset: todayWIB })
                .eq('id', userId);
            
            if (updateError) {
                console.error("Gagal me-reset token harian:", updateError);
                setAuthError("Gagal me-reset token harian, tapi jangan khawatir, data lama masih aman.");
                // Fallback to old data to prevent app from breaking
                setProfile(profileData);
            } else {
                // Update local state with the reset data
                setProfile(updatedProfile);
            }
        } else {
            // No reset needed, just set the fetched profile
            setProfile(profileData);
        }
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
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
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

  // This function now simply triggers the confirmation modal
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // This function performs the actual sign out
  const executeLogout = async () => {
    setShowLogoutConfirm(false); // Close modal first
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Gagal logout: ${error.message}`);
    } else {
      setProfile(null); // Clear profile on successful logout
    }
  };

  const handleToggleMute = () => {
    unlockAudio();
    setIsMutedState(prev => !prev);
  };
  
  const handleDeleteAccount = () => {
    const confirmation = window.prompt("Ini akan menghapus akun dan semua data project lo secara permanen. Ini tidak bisa dibatalkan. Ketik 'HAPUS' untuk konfirmasi.");
    if (confirmation === 'HAPUS') {
        alert("Fitur hapus akun akan segera tersedia. Untuk saat ini, silakan hubungi developer jika Anda ingin menghapus akun Anda.");
    }
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

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);


  const value = {
    session,
    user,
    profile,
    loading,
    authError,
    isMuted,
    showOutOfCreditsModal,
    showLogoutConfirm,
    setShowOutOfCreditsModal,
    setShowLogoutConfirm,
    handleLogout,
    executeLogout,
    handleToggleMute,
    handleDeleteAccount,
    deductCredits,
    refreshProfile,
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