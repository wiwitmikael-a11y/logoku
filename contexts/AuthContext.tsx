import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { setMuted, playBGM, stopBGM, unlockAudio, playRandomBGM } from '../services/soundService';
import type { Profile } from '../types';

export type BgmSelection = 'Mute' | 'Random' | 'Jingle' | 'Acoustic' | 'Uplifting' | 'LoFi' | 'Bamboo' | 'Ethnic' | 'Cozy';

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
  bgmSelection: BgmSelection;
  handleBgmChange: (selection: BgmSelection) => void;
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
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>(
    () => (localStorage.getItem('logoku_bgm_selection') as BgmSelection) || 'Acoustic'
  );

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, credits, last_credit_reset') // Only fetch what's needed now
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        console.error('Error fetching profile:', error);
        setAuthError('Gagal mengambil data profil pengguna.');
        return;
    }

    const profileData = (data as Profile) || { id: userId, credits: 10, last_credit_reset: '1970-01-01', storage_used_kb: 0 };
    
    const todayWIB = getTodaysDateWIB();
    
    if (profileData.last_credit_reset !== todayWIB) {
        const updatedProfileWithCredits = { ...profileData, credits: 10, last_credit_reset: todayWIB };
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: 10, last_credit_reset: todayWIB })
            .eq('id', userId);
        
        if (updateError) {
            console.error("Gagal me-reset token harian:", updateError);
            setAuthError("Gagal me-reset token harian, tapi jangan khawatir, data lama masih aman.");
            setProfile(profileData);
        } else {
            setProfile(updatedProfileWithCredits);
        }
    } else {
        setProfile(profileData);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch(error => {
      console.error("Error during initial session fetch:", error);
      setAuthError("Gagal mengambil sesi awal. Coba refresh halaman.");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
             fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);
  
  useEffect(() => {
    localStorage.setItem('logoku_bgm_selection', bgmSelection);
  }, [bgmSelection]);

  useEffect(() => {
    setMuted(isMuted);

    if (isMuted || bgmSelection === 'Mute') {
      stopBGM();
      return;
    }

    if (session) {
      if (bgmSelection === 'Random') {
        playRandomBGM();
      } else {
        playBGM(bgmSelection as any);
      }
    } else {
        stopBGM();
    }
  }, [isMuted, bgmSelection, session]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setShowLogoutConfirm(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Gagal logout: ${error.message}`);
    } else {
      setProfile(null);
    }
  };

  const handleToggleMute = () => {
    unlockAudio();
    setIsMutedState(prev => !prev);
  };
  
  const handleBgmChange = (selection: BgmSelection) => {
    unlockAudio();
    setBgmSelection(selection);
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
    bgmSelection,
    handleBgmChange,
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