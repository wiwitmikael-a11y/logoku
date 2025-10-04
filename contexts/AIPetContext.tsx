// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { AIPetState, AIPetStats } from '../types';
import { playSound } from '../services/soundService';

const STAT_MAX = 100;
const STAT_DECAY_RATE = 0.05; // Points per second
const GAME_COST = 1;
const GAME_XP_REWARD = 10;

interface AIPetContextType {
  petState: AIPetState | null;
  isInteracting: boolean;
  handleInteraction: () => void;
  handlePlayGame: (gameType: 'color' | 'pattern') => Promise<boolean>;
  onGameWin: (statBoost: Partial<AIPetStats>) => void;
  onGameLose: () => void;
  notifyPetOfActivity: (activityType: string) => void;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

// A simple debounce hook
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    return (...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

export const AIPetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user, deductCredits, addXp, setShowOutOfCreditsModal, refreshProfile } = useAuth();
  const [petState, setPetState] = useState<AIPetState | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const gameLoopRef = useRef<number>();
  
  // Debounced function for saving to Supabase
  const debouncedSave = useDebounce(async (newState: AIPetState) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ aipet_state: newState })
      .eq('id', user.id);
    if (error) console.error("Failed to sync AIPet state to Supabase:", error);
  }, 2000); // Save every 2 seconds of inactivity

  // Initialize pet state from profile or create new
  useEffect(() => {
    if (profile && !petState) { // Only run once on initial load
      if (profile.aipet_state) {
        setPetState(profile.aipet_state);
      } else {
        const initialState: AIPetState = {
          name: `${profile.full_name?.split(' ')[0] || 'My'}'s Pet`,
          stage: 'egg',
          createdAt: Date.now(),
          stats: { energy: 80, creativity: 50, intelligence: 50 },
          lastUpdated: Date.now(),
        };
        setPetState(initialState);
      }
    }
  }, [profile, petState]);
  
  // The main "Game Loop" for organic stat decay
  useEffect(() => {
    const loop = () => {
      setPetState(prev => {
        if (!prev || prev.stage === 'egg' || !isOpen) return prev;

        const now = Date.now();
        const delta = (now - prev.lastUpdated) / 1000;

        const decay = (stat: number) => {
          const sineModifier = (Math.sin(now / 5000) + 1.5) / 2.5;
          return Math.max(0, stat - STAT_DECAY_RATE * delta * sineModifier);
        };
        
        const newState = {
          ...prev,
          stats: {
            energy: decay(prev.stats.energy),
            creativity: decay(prev.stats.creativity),
            intelligence: decay(prev.stats.intelligence),
          },
          lastUpdated: now,
        };
        debouncedSave(newState);
        return newState;
      });
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    
    // For simplicity, let's assume the widget being open implies activity
    const isOpen = true; // This can be replaced with actual visibility check
    if(isOpen) gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [debouncedSave]);


  const handleInteraction = () => {
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 300);
    
    if (petState?.stage === 'egg') {
       const now = Date.now();
       const ageInSeconds = (now - petState.createdAt) / 1000;
       if (ageInSeconds > 10) {
          playSound('success');
          setPetState(prev => {
              if (!prev) return null;
              const newState = { ...prev, stage: 'child', lastUpdated: now };
              debouncedSave(newState);
              return newState;
          });
       }
    }
  };
  
  const handlePlayGame = async (gameType: 'color' | 'pattern'): Promise<boolean> => {
      if ((profile?.credits ?? 0) < GAME_COST) {
          setShowOutOfCreditsModal(true);
          return false;
      }
      const deducted = await deductCredits(GAME_COST);
      return deducted;
  };

  const onGameWin = (statBoost: Partial<AIPetStats>) => {
    playSound('success');
    addXp(GAME_XP_REWARD);
    setPetState(prev => {
      if (!prev) return null;
      const newStats = { ...prev.stats };
      for (const key in statBoost) {
        const k = key as keyof AIPetStats;
        const boost = (statBoost[k] || 0) + (Math.random() * 10 - 5);
        newStats[k] = Math.min(STAT_MAX, newStats[k] + boost);
      }
      const newState = { ...prev, stats: newStats };
      debouncedSave(newState);
      return newState;
    });
  };

  const onGameLose = () => {
    playSound('error');
  };

  const notifyPetOfActivity = (activityType: string) => {
      // Placeholder for future immersive features
      console.log(`AIPet notified of activity: ${activityType}`);
  };

  const value = {
    petState,
    isInteracting,
    handleInteraction,
    handlePlayGame,
    onGameWin,
    onGameLose,
    notifyPetOfActivity,
  };

  return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = (): AIPetContextType => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};
