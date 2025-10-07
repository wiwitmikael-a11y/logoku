// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User, Profile, DailyActions, Project } from '../types';
import { playBGM, setMuted, stopBGM, playRandomBGM, playSound } from '../services/soundService';

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

const getXpForLevel = (level: number): number => (level - 1) * 750;
const getLevelFromXp = (xp: number): number => Math.floor(xp / 750) + 1;
const getLevelUpReward = (level: number): number => level % 5 === 0 ? 5 : 2; // Bigger reward every 5 levels


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
  dailyActions: DailyActions | null;
  incrementDailyAction: (actionId: string, amount?: number) => Promise<void>;
  claimMissionReward: (missionId: string, xp: number) => Promise<void>;
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
  const [dailyActions, setDailyActions] = useState<DailyActions | null>(null);

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
  
  const fetchInitialUserData = useCallback(async (userToFetch: User | null) => {
    if (!userToFetch) {
        setProfile(null);
        setProjects([]);
        setDailyActions(null);
        return;
    }

    try {
        const [profileResponse, projectsResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userToFetch.id).single(),
            supabase.from('projects').select('*').eq('user_id', userToFetch.id).order('created_at', { ascending: false })
        ]);

        const { data: profileData, error: profileError, status } = profileResponse;

        if (profileError && status !== 406) throw profileError;

        if (profileData) {
            const authName = userToFetch.user_metadata.full_name || 'Juragan Baru';
            const authAvatar = userToFetch.user_metadata.avatar_url || null;
            const needsUpdate = profileData.full_name !== authName || profileData.avatar_url !== authAvatar;

            if (needsUpdate) {
                const updates = { full_name: authName, avatar_url: authAvatar };
                const syncedProfile = { ...profileData, ...updates };
                setProfile(syncedProfile);
                setDailyActions(syncedProfile.daily_actions || { claimed_missions: [] });

                const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userToFetch.id);
                if (updateError) console.error("Failed to sync profile to DB:", updateError);
            } else {
                setProfile(profileData);
                setDailyActions(profileData.daily_actions || { claimed_missions: [] });
            }
        } else if (status === 406) {
            const { data: newProfileData, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userToFetch.id,
                full_name: userToFetch.user_metadata.full_name || 'Juragan Baru',
                avatar_url: userToFetch.user_metadata.avatar_url || '',
                credits: 20, welcome_bonus_claimed: true, xp: 0, level: 1, achievements: [],
                total_projects_completed: 0, completed_first_steps: [], aipet_state: null,
                daily_actions: { claimed_missions: [] },
              })
              .select()
              .single();
            if (insertError) throw insertError;
            setProfile(newProfileData);
            setDailyActions(newProfileData.daily_actions || { claimed_missions: [] });
        }

        const { data: projectsData, error: projectsError } = projectsResponse;
        if (projectsError) {
            setAuthError(`Gagal mengambil data project: ${projectsError.message}`);
            setProjects([]);
        } else {
            setProjects(projectsData as Project[] || []);
        }

    } catch (error: any) {
        setAuthError(`Gagal memuat data pengguna: ${error.message}`);
        console.error("Error in fetchInitialUserData:", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
        await fetchInitialUserData(user);
    }
  }, [user, fetchInitialUserData]);


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
    
    if (error) console.error("Error adding XP:", error);
    else setProfile(data);
  }, [user, profile]);

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
        return false;
    } else {
        setProfile(data);
        return true;
    }
  }, [user, profile]);

  const grantAchievement = useCallback(async (achievementId: string) => {
    if (!user || !profile || profile.achievements.includes(achievementId)) return;
    const newAchievements = [...profile.achievements, achievementId];
    const { error } = await supabase
        .from('profiles')
        .update({ achievements: newAchievements })
        .eq('id', user.id);
    
    if (error) {
        console.error("Error granting achievement:", error);
    } else {
        await refreshProfile();
        setUnlockedAchievement({ id: achievementId, ...ACHIEVEMENTS_MAP[achievementId] });
    }
  }, [user, profile, refreshProfile]);

  const grantFirstTimeCompletionBonus = useCallback(async (step: string) => {
    if (!user || !profile || profile.total_projects_completed > 0 || profile.completed_first_steps.includes(step)) return;
    
    const newCompletedSteps = [...profile.completed_first_steps, step];
    const newCredits = profile.credits + 1;
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ completed_first_steps: newCompletedSteps, credits: newCredits })
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) console.error("Error granting first time bonus:", error);
    else setProfile(data);
  }, [user, profile]);

  const incrementDailyAction = useCallback(async (actionId: string, amount = 1) => {
    if (!user) return;
    const { error } = await supabase.rpc('increment_daily_action', { p_user_id: user.id, p_action_id: actionId, p_amount: amount });
    if (error) console.error(`Error incrementing daily action ${actionId}:`, error);
    else await refreshProfile();
  }, [user, refreshProfile]);

  const claimMissionReward = useCallback(async (missionId: string, xp: number) => {
    if (!user || dailyActions?.claimed_missions?.includes(missionId)) return;
    
    const { error } = await supabase.rpc('claim_daily_mission', { p_user_id: user.id, p_mission_id: missionId });
    if (error) {
        console.error('Error claiming mission:', error);
        alert(`Gagal klaim: ${error.message}`);
    } else {
        await addXp(xp);
        await refreshProfile();
    }
  }, [user, dailyActions, addXp, refreshProfile]);
  
  useEffect(() => {
    setMuted(isMuted);
    if (!isMuted) handleBgmChange(bgmSelection);
    else stopBGM();
  }, [isMuted, bgmSelection, handleBgmChange]);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        
        await fetchInitialUserData(newUser); 
        
        setLoading(false); 
        
        if (event === 'SIGNED_OUT') {
            stopBGM();
        }
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, [fetchInitialUserData]);
  
  const value: AuthContextType = { session, user, profile, projects, setProjects, loading, authError, refreshProfile, addXp, grantAchievement, showOutOfCreditsModal, setShowOutOfCreditsModal, grantFirstTimeCompletionBonus, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement, deductCredits, isMuted, handleToggleMute, bgmSelection, handleBgmChange, showLogoutConfirm, setShowLogoutConfirm, handleLogout, executeLogout, handleDeleteAccount, dailyActions, incrementDailyAction, claimMissionReward };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};