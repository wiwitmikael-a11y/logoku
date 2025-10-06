// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { setMuted, playBGM, stopBGM, unlockAudio, playRandomBGM } from '../services/soundService';
// FIX: Import DailyActions type.
import type { Profile, DailyActions } from '../types';

export type BgmSelection = 'Mute' | 'Random' | 'Jingle' | 'Acoustic' | 'Uplifting' | 'LoFi' | 'Bamboo' | 'Ethnic' | 'Cozy';

// NEW: Gamification types
export interface LevelUpInfo {
  newLevel: number;
  tokenReward: number;
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

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
  addCredits: (amount: number, reason: string) => Promise<void>; // NEW: Centralized bonus token function
  refreshProfile: () => Promise<void>;
  bgmSelection: BgmSelection;
  handleBgmChange: (selection: BgmSelection) => void;
  // NEW: Gamification states and functions
  addXp: (amount: number) => Promise<void>;
  grantAchievement: (achievementId: string) => Promise<void>;
  grantFirstTimeCompletionBonus: (stepName: string) => Promise<void>; // Renamed for clarity
  showLevelUpModal: boolean;
  levelUpInfo: LevelUpInfo | null;
  setShowLevelUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  unlockedAchievement: Achievement | null;
  setUnlockedAchievement: React.Dispatch<React.SetStateAction<Achievement | null>>;
  // FIX: Added dailyActions, incrementDailyAction, and claimMissionReward to type.
  dailyActions: DailyActions | null;
  incrementDailyAction: (actionId: string) => Promise<void>;
  claimMissionReward: (missionId: string, xpReward: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getTodaysDateWIB = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
};

// --- KONFIGURASI TOKENOMICS ---
const WELCOME_BONUS_CREDITS = 20;

// NEW: Achievement definitions
const ACHIEVEMENTS_MAP: { [key: string]: Achievement } = {
  BRAND_PERTAMA_LAHIR: { id: 'BRAND_PERTAMA_LAHIR', name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { id: 'SANG_KOLEKTOR', name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { id: 'SULTAN_KONTEN', name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥉' },
};

// FIX: Added daily missions constant.
const DAILY_MISSIONS = [
  { id: 'created_captions', description: 'Bikin 1 caption di Tools Lanjutan', xp: 10, target: 1 },
  { id: 'liked_projects', description: "Kasih 'Menyala!' di 3 karya Pameran Brand", xp: 15, target: 3 },
  { id: 'created_posts', description: 'Bales 1 topik di WarKop Juragan', xp: 5, target: 1 },
];


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>(
    () => (localStorage.getItem('logoku_bgm_selection') as BgmSelection) || 'Acoustic'
  );
  
  // --- NEW: Gamification State ---
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  


  const fetchProfile = useCallback(async (user: User) => {
    const userId = user.id;
    let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "not found", which is fine
        console.error('Error fetching profile:', error);
        setAuthError('Gagal mengambil data profil pengguna.');
        return;
    }
    
    if (!data) {
        // Profile not found. It's likely being created by the DB trigger.
        // Poll for a few seconds to wait for it.
        let attempts = 0;
        let profileFromTrigger: Profile | null = null;
    
        while (attempts < 5 && !profileFromTrigger) {
            await new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms
            const { data: refetchedData, error: refetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
    
            if (refetchError && refetchError.code !== 'PGRST116') {
                // A real error occurred during polling, not just "not found"
                console.error('Error polling for new user profile:', refetchError);
                setAuthError('Gagal memverifikasi data profil baru.');
                return;
            }
    
            if (refetchedData) {
                profileFromTrigger = refetchedData as Profile;
            }
            attempts++;
        }
    
        if (profileFromTrigger) {
            // Successfully fetched the profile created by the trigger.
            // Assign it to 'data' to let the downstream logic (daily updates, etc.) run.
            data = profileFromTrigger;
        } else {
            // After polling, the profile still doesn't exist. This indicates a real problem,
            // likely that the database trigger failed to execute.
            console.error('Profile not found after polling for 2.5 seconds. The on-signup trigger may have failed.');
            setAuthError('Gagal membuat profil baru untuk Juragan. Silakan coba login ulang atau hubungi developer.');
            return;
        }
    }
    
    // If we are here, 'data' must contain a profile (either from initial select or polling).
    const profileData: Profile = {
        ...data,
        xp: data.xp ?? 0,
        level: data.level ?? 1,
        achievements: data.achievements ?? [],
        total_projects_completed: data.total_projects_completed ?? 0,
        last_daily_xp_claim: data.last_daily_xp_claim ?? '2000-01-01',
        completed_first_steps: data.completed_first_steps ?? [],
        aipet_state: data.aipet_state ?? null,
        aipet_pity_counter: data.aipet_pity_counter ?? 0,
        data_fragments: data.data_fragments ?? 0,
        daily_actions: data.daily_actions, // Keep as is, will be validated next
    };
    
    // Defensive coding: Ensure daily_actions is a valid object before proceeding.
    // This handles cases where it's null, undefined, or not an object after a data wipe.
    if (typeof profileData.daily_actions !== 'object' || profileData.daily_actions === null || !('claimed_missions' in profileData.daily_actions)) {
        profileData.daily_actions = { claimed_missions: [] };
    }
    
    const todayWIB = getTodaysDateWIB();
    let updates: Partial<Profile> = {};
    let shouldUpdate = false;

    // --- Daily Token Top-up System ---
    if (profileData.last_credit_reset !== todayWIB) {
        const DAILY_TOKENS = 5;
        if ((profileData.credits ?? 0) < DAILY_TOKENS) {
            updates.credits = DAILY_TOKENS;
        }
        updates.last_credit_reset = todayWIB;
        shouldUpdate = true;
    }
    
    // Daily XP Claim Logic & Daily Actions Reset
    if (profileData.last_daily_xp_claim !== todayWIB) {
        const DAILY_XP = 10;
        updates.xp = (profileData.xp ?? 0) + DAILY_XP;
        updates.last_daily_xp_claim = todayWIB;
        updates.daily_actions = { claimed_missions: [] };
        shouldUpdate = true;
    }
    
    // Sync profile name and avatar from provider
    if (profileData.full_name !== user.user_metadata.full_name || profileData.avatar_url !== user.user_metadata.avatar_url) {
        updates.full_name = user.user_metadata.full_name;
        updates.avatar_url = user.user_metadata.avatar_url;
        shouldUpdate = true;
    }

    if (shouldUpdate) {
        const { data: updatedProfileData, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (updateError) {
            console.error("Gagal melakukan update harian/profil:", updateError);
            setAuthError("Gagal sinkronisasi data profil, tapi jangan khawatir, data lama masih aman.");
            setProfile(profileData);
        } else {
            setProfile(updatedProfileData as Profile);
        }
    } else {
        setProfile(profileData);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        }
      } catch (error) {
        console.error("Error during initial session fetch:", error);
        setAuthError("Gagal mengambil sesi awal. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
             fetchProfile(session.user);
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
  
  const addCredits = useCallback(async (amount: number, reason: string) => {
    if (!profile || !user || amount <= 0) return;
    
    console.log(`Adding ${amount} credits for: ${reason}`);
    
    const newCredits = (profile.credits ?? 0) + amount;
    const { data, error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        setAuthError(`Gagal menambah token bonus: ${error.message}`);
    } else {
        setProfile(data as Profile);
    }
  }, [profile, user]);

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!profile || !user) {
        setAuthError("Pengguna tidak terautentikasi untuk mengurangi token.");
        return false;
    }

    if (profile.credits < amount) {
        setShowOutOfCreditsModal(true);
        return false;
    }

    const newCredits = profile.credits - amount;
    const { data, error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        setAuthError(`Gagal mengurangi token: ${error.message}`);
        return false;
    }

    setProfile(data as Profile);
    return true;
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // --- Gamification Logic ---
  const getLevelForXp = (xp: number): number => {
    return Math.floor(xp / 750) + 1;
  };

  const addXp = useCallback(async (amount: number) => {
    if (!profile || !user) return;

    const currentXp = profile.xp ?? 0;
    const currentLevel = profile.level ?? 1;
    const newXp = currentXp + amount;
    const newLevel = getLevelForXp(newXp);

    let updates: Partial<Profile> = { xp: newXp };

    if (newLevel > currentLevel) {
        const tokenReward = (newLevel % 5 === 0) ? 5 : 1;
        setLevelUpInfo({ newLevel, tokenReward });
        setShowLevelUpModal(true);
        updates.credits = (profile.credits ?? 0) + tokenReward;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        setAuthError(`Gagal update XP: ${error.message}`);
    } else {
        setProfile(data as Profile);
    }
  }, [profile, user]);

  const grantAchievement = useCallback(async (achievementId: string) => {
      if (!profile || !user || profile.achievements.includes(achievementId)) return;
      
      const newAchievements = [...profile.achievements, achievementId];
      const { data, error } = await supabase
          .from('profiles')
          .update({ achievements: newAchievements })
          .eq('id', user.id)
          .select()
          .single();

      if (error) {
          setAuthError(`Gagal memberikan pencapaian: ${error.message}`);
      } else {
          setProfile(data as Profile);
          const achievementDetails = ACHIEVEMENTS_MAP[achievementId];
          if (achievementDetails) {
              setUnlockedAchievement(achievementDetails);
          }
      }
  }, [profile, user]);
  
  const grantFirstTimeCompletionBonus = useCallback(async (stepName: string) => {
      if (!profile || !user || profile.completed_first_steps.includes(stepName)) return;

      const newCompletedSteps = [...profile.completed_first_steps, stepName];
      const currentXp = profile.xp ?? 0;
      const currentLevel = profile.level ?? 1;
      const newXp = currentXp + 25;
      const newLevel = getLevelForXp(newXp);

      let creditsUpdate = (profile.credits ?? 0) + 1; // Refund 1 token

      if (newLevel > currentLevel) {
          const tokenReward = (newLevel % 5 === 0) ? 5 : 1;
          setLevelUpInfo({ newLevel, tokenReward });
          setShowLevelUpModal(true);
          creditsUpdate += tokenReward; // Combine token rewards
      }

      const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
              completed_first_steps: newCompletedSteps,
              xp: newXp,
              credits: creditsUpdate
          })
          .eq('id', user.id)
          .select()
          .single();
          
      if (updateError) {
          setAuthError(`Gagal memberikan bonus langkah: ${updateError.message}`);
      } else {
          setProfile(updatedProfile as Profile);
      }
  }, [profile, user]);

  const incrementDailyAction = useCallback(async (actionId: string) => {
    if (!profile || !user) return;
    const todayWIB = getTodaysDateWIB();
    let currentActions = profile.daily_actions ?? { claimed_missions: [] };
    if (profile.last_daily_xp_claim !== todayWIB) {
        currentActions = { claimed_missions: [] };
    }
    const newCount = ((currentActions[actionId] as number) || 0) + 1;
    const newActions = { ...currentActions, [actionId]: newCount };
    const { data, error } = await supabase.from('profiles').update({ daily_actions: newActions }).eq('id', user.id).select().single();
    if (error) setAuthError(`Gagal update aksi harian: ${error.message}`);
    else setProfile(data as Profile);
  }, [profile, user]);

  const claimMissionReward = useCallback(async (missionId: string, xpReward: number) => {
    if (!profile || !user) return;
    const currentActions = profile.daily_actions ?? { claimed_missions: [] };
    const claimed = currentActions.claimed_missions ?? [];
    if (claimed.includes(missionId)) return;

    const progress = (currentActions[missionId] as number) || 0;
    const mission = DAILY_MISSIONS.find(m => m.id === missionId);
    if (!mission || progress < mission.target) return;

    // --- Combine updates ---
    const newActions = { ...currentActions, claimed_missions: [...claimed, missionId] };
    const currentXp = profile.xp ?? 0;
    const currentLevel = profile.level ?? 1;
    const newXp = currentXp + xpReward;
    const newLevel = getLevelForXp(newXp);
    
    const updates: Partial<Profile> = { 
        daily_actions: newActions,
        xp: newXp 
    };

    if (newLevel > currentLevel) {
        const tokenReward = (newLevel % 5 === 0) ? 5 : 1;
        setLevelUpInfo({ newLevel, tokenReward });
        setShowLevelUpModal(true);
        updates.credits = (profile.credits ?? 0) + tokenReward;
    }

    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) {
        setAuthError(`Gagal klaim hadiah: ${error.message}`);
    } else {
        setProfile(data as Profile);
    }
  }, [profile, user]);


  const value: AuthContextType = {
    session, user, profile, loading, authError, isMuted,
    showOutOfCreditsModal, showLogoutConfirm,
    setShowOutOfCreditsModal, setShowLogoutConfirm,
    handleLogout, executeLogout, handleToggleMute, handleDeleteAccount,
    deductCredits, addCredits, refreshProfile, bgmSelection, handleBgmChange,
    // Gamification
    addXp, grantAchievement, grantFirstTimeCompletionBonus, showLevelUpModal, levelUpInfo, setShowLevelUpModal,
    unlockedAchievement, setUnlockedAchievement,
    // FIX: Expose dailyActions, incrementDailyAction, and claimMissionReward in context value.
    dailyActions: profile?.daily_actions ?? null,
    incrementDailyAction,
    claimMissionReward,
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
