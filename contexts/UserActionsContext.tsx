// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { DailyActions } from '../types';

// Constants
const getLevelFromXp = (xp: number): number => Math.floor(xp / 750) + 1;
const getLevelUpReward = (level: number): number => {
    if (level % 10 === 0) return 5; // Major milestone reward
    if (level % 5 === 0) return 3;  // Minor milestone reward
    return 1;                       // Standard level up reward
};

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

interface UserActionsContextType {
  // Modals and Toasts
  showOutOfCreditsModal: boolean;
  setShowOutOfCreditsModal: (show: boolean) => void;
  showLevelUpModal: boolean;
  levelUpInfo: LevelUpInfo | null;
  setShowLevelUpModal: (show: boolean) => void;
  unlockedAchievement: Achievement | null;
  setUnlockedAchievement: (achievement: Achievement | null) => void;

  // Actions
  deductCredits: (amount: number) => Promise<boolean>;
  addXp: (amount: number) => Promise<void>;
  grantAchievement: (achievementId: string) => Promise<void>;
  grantFirstTimeCompletionBonus: (step: string) => Promise<void>;
  
  // Daily Actions
  dailyActions: DailyActions | null;
  incrementDailyAction: (actionId: string, amount?: number) => Promise<void>;
  claimMissionReward: (missionId: string, xp: number) => Promise<void>;
}

const UserActionsContext = createContext<UserActionsContextType | undefined>(undefined);

export const UserActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const dailyActions = profile?.daily_actions || null;

  const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;
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
        console.error("Error deducting credits:", error);
        return false;
    } else {
        await refreshProfile(); // Refresh to get the latest profile state
        return true;
    }
  }, [user, profile, refreshProfile]);

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
    
    const { error } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel, credits: newCredits })
        .eq('id', user.id);
    
    if (error) console.error("Error adding XP:", error);
    else await refreshProfile();
  }, [user, profile, refreshProfile]);

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
    
    const { error } = await supabase
        .from('profiles')
        .update({ completed_first_steps: newCompletedSteps, credits: newCredits })
        .eq('id', user.id);
    
    if (error) console.error("Error granting first time bonus:", error);
    else await refreshProfile();
  }, [user, profile, refreshProfile]);

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
    }
  }, [user, dailyActions, addXp]);

  const value: UserActionsContextType = {
    showOutOfCreditsModal, setShowOutOfCreditsModal,
    showLevelUpModal, levelUpInfo, setShowLevelUpModal,
    unlockedAchievement, setUnlockedAchievement,
    deductCredits, addXp, grantAchievement, grantFirstTimeCompletionBonus,
    dailyActions, incrementDailyAction, claimMissionReward
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
