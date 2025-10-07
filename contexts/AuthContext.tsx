// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User, Profile, Project } from '../types';
import { playBGM, setMuted, stopBGM, playRandomBGM } from '../services/soundService';

export type BgmSelection = 'Mute' | 'Random' | 'Jingle' | 'Acoustic' | 'Uplifting' | 'LoFi' | 'Bamboo' | 'Ethnic' | 'Cozy';

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

const ACHIEVEMENTS_MAP: { [key: string]: { name: string; description: string; icon: string; } } = {
  BRAND_PERTAMA_LAHIR: { name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loading: boolean;
  showOutOfCreditsModal: boolean;
  setShowOutOfCreditsModal: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  handleLogout: () => void;
  executeLogout: () => Promise<void>;
  handleDeleteAccount: () => void;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  grantAchievement: (achievementId: string) => Promise<void>;
  grantFirstTimeCompletionBonus: (step: string) => Promise<void>;
  showLevelUpModal: boolean;
  levelUpInfo: LevelUpInfo | null;
  setShowLevelUpModal: (show: boolean) => void;
  unlockedAchievement: Achievement | null;
  setUnlockedAchievement: (achievement: Achievement | null) => void;
  deductCredits: (amount: number) => Promise<boolean>;
  isMuted: boolean;
  handleToggleMute: () => void;
  bgmSelection: BgmSelection;
  handleBgmChange: (selection: BgmSelection) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  
  const [isMuted, setIsMutedState] = useState(() => localStorage.getItem('desainfun_isMuted') === 'true');
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>(() => (localStorage.getItem('desainfun_bgmSelection') as BgmSelection) || 'Random');

  const getLevelFromXp = (xp: number): number => Math.floor(xp / 750) + 1;
  const getLevelUpReward = (level: number): number => {
      if (level % 10 === 0) return 10;
      if (level % 5 === 0) return 5;
      return 2;
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const executeLogout = async () => {
    stopBGM();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProjects([]);
    setShowLogoutConfirm(false);
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      alert("This is a permanent action! We are calling the RPC function to delete your data.");
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
          alert(`Error deleting account: ${error.message}`);
      } else {
          alert("Your account and all associated data have been deleted.");
          await executeLogout();
      }
  };

  const handleToggleMute = useCallback(() => {
    setIsMutedState(prev => {
        const newMuted = !prev;
        localStorage.setItem('desainfun_isMuted', String(newMuted));
        setMuted(newMuted);
        if (newMuted) {
            stopBGM();
        } else {
            if (bgmSelection === 'Mute') {
                const newSelection = 'Random';
                setBgmSelection(newSelection);
                localStorage.setItem('desainfun_bgmSelection', newSelection);
                playRandomBGM();
            } else if (bgmSelection === 'Random') {
                playRandomBGM();
            } else {
                playBGM(bgmSelection as any);
            }
        }
        return newMuted;
    });
  }, [bgmSelection]);

  const handleBgmChange = useCallback((selection: BgmSelection) => {
    setBgmSelection(selection);
    localStorage.setItem('desainfun_bgmSelection', selection);
    if (isMuted && selection !== 'Mute') {
        setIsMutedState(false);
        localStorage.setItem('desainfun_isMuted', 'false');
        setMuted(false);
    }

    if (selection === 'Mute') {
        stopBGM();
        setIsMutedState(true);
        localStorage.setItem('desainfun_isMuted', 'true');
        setMuted(true);
    } else if (selection === 'Random') {
        playRandomBGM();
    } else {
        playBGM(selection as any);
    }
  }, [isMuted]);

  const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;
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
        console.error("Error deducting credits:", error);
        setAuthError(`Gagal mengurangi token: ${error.message}`);
        return false;
    } else {
        setProfile(data);
        return true;
    }
  }, [user, profile]);

  const addXp = useCallback(async (amount: number) => {
    if (!user || !profile) return;

    const currentLevel = profile.level;
    const newXp = profile.xp + amount;
    const newLevel = getLevelFromXp(newXp);

    let newCredits = profile.credits;
    if (newLevel > currentLevel) {
        const reward = getLevelUpReward(newLevel);
        newCredits += reward;
        setLevelUpInfo({ newLevel, tokenReward: reward });
        setShowLevelUpModal(true);
    }
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel, credits: newCredits })
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        setAuthError(`Gagal menambah XP: ${error.message}`);
    } else {
        setProfile(data);
    }
  }, [user, profile]);

  const grantAchievement = useCallback(async (achievementId: string) => {
    if (!user || !profile || profile.achievements.includes(achievementId)) return;
    const newAchievements = [...profile.achievements, achievementId];
    const { data, error } = await supabase
        .from('profiles')
        .update({ achievements: newAchievements })
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        setAuthError(`Gagal memberi lencana: ${error.message}`);
    } else {
        setProfile(data);
        setUnlockedAchievement({ id: achievementId, ...ACHIEVEMENTS_MAP[achievementId] });
    }
  }, [user, profile]);

  const grantFirstTimeCompletionBonus = useCallback(async (step: string) => {
    if (!user || !profile || profile.total_projects_completed > 0 || profile.completed_first_steps.includes(step)) {
        return;
    }
    
    const newCompletedSteps = [...profile.completed_first_steps, step];
    const newCredits = profile.credits + 1;
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ completed_first_steps: newCompletedSteps, credits: newCredits })
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        setAuthError(`Gagal memberi bonus: ${error.message}`);
    } else {
        setProfile(data);
    }
  }, [user, profile]);
  
  const fetchInitialUserData = useCallback(async (userToFetch: User | null) => {
    if (!userToFetch) {
        setProfile(null);
        setProjects([]);
        return;
    }

    try {
        const { data: profileData, error: profileError, status } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userToFetch.id)
            .single();

        if (profileError && status !== 406) throw profileError;

        let finalProfile: Profile | null = null;

        if (profileData) {
            const authName = userToFetch.user_metadata.full_name || 'Juragan Baru';
            const authAvatar = userToFetch.user_metadata.avatar_url || null;
            const needsUpdate = profileData.full_name !== authName || profileData.avatar_url !== authAvatar;

            if (needsUpdate) {
                const updates = { full_name: authName, avatar_url: authAvatar };
                const { data: syncedProfile, error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', userToFetch.id)
                    .select()
                    .single();
                if (updateError) console.error("Failed to sync profile to DB:", updateError);
                finalProfile = syncedProfile;
            } else {
                finalProfile = profileData;
            }
        } else if (status === 406) {
            const { data: newProfileData, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userToFetch.id,
                full_name: userToFetch.user_metadata.full_name || 'Juragan Baru',
                avatar_url: userToFetch.user_metadata.avatar_url || '',
                credits: 20, welcome_bonus_claimed: true, xp: 0, level: 1, achievements: [],
                total_projects_completed: 0, completed_first_steps: [], aipet_state: null
              })
              .select()
              .single();
            if (insertError) throw insertError;
            finalProfile = newProfileData;
        }

        setProfile(finalProfile);

        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userToFetch.id)
            .order('created_at', { ascending: false });

        if (projectsError) {
            setAuthError(`Gagal mengambil data project: ${projectsError.message}`);
            setProjects([]);
        } else {
            setProjects(projectsData as Project[] || []);
        }

    } catch (error: any) {
        setAuthError(`Gagal memuat data pengguna: ${error.message}`);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) setAuthError(error.message);
        else setProfile(data);
    }
  }, [user]);
  
  useEffect(() => {
    setMuted(isMuted);
    if (!isMuted) {
        handleBgmChange(bgmSelection);
    } else {
        stopBGM();
    }
  }, [isMuted, bgmSelection, handleBgmChange]);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            await fetchInitialUserData(currentUser);
        }
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Gagal menginisialisasi sesi.");
      } finally {
        setLoading(false);
      }
    };
    
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, [fetchInitialUserData]);
  
  const value: AuthContextType = { session, user, profile, projects, setProjects, loading, showOutOfCreditsModal, setShowOutOfCreditsModal, showLogoutConfirm, setShowLogoutConfirm, handleLogout, executeLogout, handleDeleteAccount, authError, refreshProfile, addXp, grantAchievement, grantFirstTimeCompletionBonus, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement, deductCredits, isMuted, handleToggleMute, bgmSelection, handleBgmChange };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};