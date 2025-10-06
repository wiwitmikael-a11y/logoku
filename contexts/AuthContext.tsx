// FIX: Created this file to resolve "not a module" errors. It provides the AuthContext, AuthProvider, and useAuth hook.
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User, Profile } from '../types';
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

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
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
  dailyActions: any; // Simplified
  incrementDailyAction: (actionId: string, amount?: number) => Promise<void>;
  claimMissionReward: (missionId: string, xp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [bgmSelection, setBgmSelection] = useState<BgmSelection>('Random');
  const [dailyActions, setDailyActions] = useState(null);

  // Mock implementations
  const refreshProfile = useCallback(async () => { console.log('refreshProfile called'); }, []);
  const addXp = useCallback(async (amount: number) => { console.log(`addXp called with ${amount}`); }, []);
  const grantAchievement = useCallback(async (achievementId: string) => { console.log(`grantAchievement called with ${achievementId}`); }, []);
  const grantFirstTimeCompletionBonus = useCallback(async (step: string) => { console.log(`grantFirstTimeCompletionBonus called for ${step}`); }, []);
  const deductCredits = useCallback(async (amount: number): Promise<boolean> => { console.log(`deductCredits called with ${amount}`); return true; }, []);
  const incrementDailyAction = useCallback(async (actionId: string, amount = 1) => { console.log(`incrementDailyAction for ${actionId}`); }, []);
  const claimMissionReward = useCallback(async (missionId: string, xp: number) => { console.log(`claimMissionReward for ${missionId}`); }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const executeLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setShowLogoutConfirm(false);
  };
  const handleDeleteAccount = () => { alert('Account deletion is not implemented yet.'); };

  const handleToggleMute = () => {
    setIsMutedState(prev => {
        const newMuted = !prev;
        setMuted(newMuted);
        if (newMuted) {
            stopBGM();
        } else {
            handleBgmChange(bgmSelection);
        }
        return newMuted;
    });
  };

  const handleBgmChange = (selection: BgmSelection) => {
    setBgmSelection(selection);
    if (isMuted) return;
    if (selection === 'Mute') {
        stopBGM();
    } else if (selection === 'Random') {
        playRandomBGM();
    } else {
        playBGM(selection);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  const value: AuthContextType = {
    session, user, profile, loading, authError, refreshProfile, addXp, grantAchievement, showOutOfCreditsModal, setShowOutOfCreditsModal, grantFirstTimeCompletionBonus, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement, deductCredits, isMuted, handleToggleMute, bgmSelection, handleBgmChange, showLogoutConfirm, setShowLogoutConfirm, handleLogout, executeLogout, handleDeleteAccount, dailyActions, incrementDailyAction, claimMissionReward
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
