// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { playSound } from '../services/soundService';
import type { Achievement, LevelUpInfo, BrandInputs } from '../types';

interface UserActionsContextType {
  deductCredits: (amount: number) => Promise<boolean>;
  addXp: (amount: number) => Promise<void>;
  showOutOfCreditsModal: boolean;
  setShowOutOfCreditsModal: (show: boolean) => void;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (show: boolean) => void;
  levelUpInfo: LevelUpInfo | null;
  unlockedAchievement: Achievement | null;
  setUnlockedAchievement: (achievement: Achievement | null) => void;
  checkForNewAchievements: (projectsCount: number) => void;
}

const UserActionsContext = createContext<UserActionsContextType | undefined>(undefined);

const ACHIEVEMENTS_MAP: { [key: string]: Achievement } = {
  BRAND_PERTAMA_LAHIR: { id: 'BRAND_PERTAMA_LAHIR', name: 'Brand Pertama Lahir!', description: 'Berhasil menyelesaikan project branding pertama.', icon: '🥉' },
  SANG_KOLEKTOR: { id: 'SANG_KOLEKTOR', name: 'Sang Kolektor', description: 'Berhasil menyelesaikan 5 project branding.', icon: '🥈' },
  SULTAN_KONTEN: { id: 'SULTAN_KONTEN', name: 'Sultan Konten', description: 'Berhasil menyelesaikan 10 project branding.', icon: '🥇' },
};

export const UserActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || !profile || profile.credits < amount) {
      setShowOutOfCreditsModal(true);
      return false;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('deduct_credits', { user_id: user.id, amount });
    if (error) {
      console.error("Error deducting credits:", error);
      return false;
    }
    await refreshProfile();
    return true;
  }, [user, profile, refreshProfile]);

  const addXp = useCallback(async (amount: number) => {
    if (!user || !profile) return;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('add_xp', { user_id: user.id, amount });
    if (error) {
      console.error("Error adding XP:", error);
    } else if (data) {
        if (data.level_up) {
            setLevelUpInfo({ newLevel: data.new_level, reward: `+${data.credit_reward} Token` });
            setShowLevelUpModal(true);
            playSound('success'); // or a specific level up sound
        }
    }
    await refreshProfile();
  }, [user, profile, refreshProfile]);

  const checkForNewAchievements = useCallback((projectsCount: number) => {
    if (!profile) return;
    const checkAndUnlock = async (achievementId: string) => {
        if (!profile.achievements.includes(achievementId)) {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('profiles').update({ achievements: [...profile.achievements, achievementId] }).eq('id', profile.id);
            if (!error) {
                setUnlockedAchievement(ACHIEVEMENTS_MAP[achievementId]);
                await refreshProfile();
            }
        }
    };
    if (projectsCount >= 1) checkAndUnlock('BRAND_PERTAMA_LAHIR');
    if (projectsCount >= 5) checkAndUnlock('SANG_KOLEKTOR');
    if (projectsCount >= 10) checkAndUnlock('SULTAN_KONTEN');

  }, [profile, refreshProfile]);

  const value: UserActionsContextType = {
    deductCredits,
    addXp,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
    showLevelUpModal,
    setShowLevelUpModal,
    levelUpInfo,
    unlockedAchievement,
    setUnlockedAchievement,
    checkForNewAchievements,
  };

  return <UserActionsContext.Provider value={value}>{children}</UserActionsContext.Provider>;
};

export const useUserActions = () => {
  const context = useContext(UserActionsContext);
  if (context === undefined) {
    throw new Error('useUserActions must be used within a UserActionsProvider');
  }
  return context;
};
