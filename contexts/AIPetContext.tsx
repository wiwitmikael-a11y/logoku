// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { AIPetState, AIPetPersonalityVector } from '../types';
import { generateAIPetNarrative } from '../services/geminiService';

export type VisualEffect = { type: 'feed', id: number } | null;

interface AIPetContextType {
  petState: AIPetState | null;
  isLoading: boolean;
  isPetOnScreen: boolean;
  setIsPetOnScreen: (onScreen: boolean) => void;
  notifyPetOfActivity: (activity: string, detail?: string) => void;
  contextualMessage: string | null;
  showContextualMessage: (message: string | null) => void;
  visualEffect: VisualEffect | null;
  clearVisualEffect: () => void;
  activatePetWithTokens: () => Promise<void>;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

export const AIPetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [petState, setPetState] = useState<AIPetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPetOnScreen, setIsPetOnScreen] = useState(true);
  const [contextualMessage, showContextualMessage] = useState<string | null>(null);
  const [visualEffect, setVisualEffect] = useState<VisualEffect | null>(null);

  useEffect(() => {
      if (profile) {
          setPetState(profile.aipet_state || null);
          setIsLoading(false);
      } else if (!user) { // If user logs out or auth is loading
          setPetState(null);
          setIsLoading(true); // Set to true until we confirm there's no profile
      }
      if(user && !profile) {
          setIsLoading(true); // Loading profile
      }
      if(!user) {
          setIsLoading(false); // No user, so not loading pet
      }

  }, [profile, user]);

  const notifyPetOfActivity = useCallback(async (activity: string, detail?: string) => {
    if (!user || !petState || petState.stage === 'aipod') return;
    const { error } = await supabase.rpc('update_aipet_activity', {
        p_user_id: user.id,
        p_activity_type: activity,
        p_detail: detail || null
    });
    if (error) console.error("Failed to notify pet of activity:", error);
    else await refreshProfile();
  }, [user, petState, refreshProfile]);

  const clearVisualEffect = useCallback(() => {
    setVisualEffect(null);
  }, []);

  const activatePetWithTokens = useCallback(async () => {
    if (!user || !profile) throw new Error("User not logged in.");
    if (profile.aipet_state && profile.aipet_state.stage !== 'aipod') throw new Error("Pet is already active.");
    if (profile.credits < 5) {
        throw new Error(`Token tidak cukup. Butuh 5, kamu punya ${profile.credits}.`);
    }

    const { data, error } = await supabase.rpc('activate_aipet');

    if (error) {
        throw new Error(`Gagal aktivasi di server: ${error.message}`);
    }
    
    const newPetState = data as AIPetState;

    const getDominantTrait = (p: AIPetPersonalityVector): keyof AIPetPersonalityVector => {
      return (Object.keys(p) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => p[a] > p[b] ? a : b);
    };
    const dominantTrait = getDominantTrait(newPetState.personality);
    const narrative = await generateAIPetNarrative(newPetState.name, newPetState.tier, dominantTrait);
    
    const { error: narrativeError } = await supabase
        .from('profiles')
        .update({ aipet_state: { ...newPetState, narrative } })
        .eq('id', user.id);

    if (narrativeError) {
        console.error("Failed to save pet narrative:", narrativeError);
    }
    
    await refreshProfile();

  }, [user, profile, refreshProfile]);

  const value: AIPetContextType = { petState, isLoading, isPetOnScreen, setIsPetOnScreen, notifyPetOfActivity, contextualMessage, showContextualMessage, visualEffect, clearVisualEffect, activatePetWithTokens };

  return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = () => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};
