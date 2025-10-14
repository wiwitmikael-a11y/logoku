// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
// FIX: Import missing AIPet types.
import type { AIPetState, AIPetPersonalityVector } from '../types';
// FIX: Import missing geminiService function.
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
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [petState, setPetState] = useState<AIPetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPetOnScreen, setIsPetOnScreen] = useState(true);
  const [contextualMessage, showContextualMessage] = useState<string | null>(null);
  const [visualEffect, setVisualEffect] = useState<VisualEffect | null>(null);

  useEffect(() => {
    // This logic is now driven by the master loading state from AuthContext.
    // If auth is loading, AIPet is also loading.
    if (authLoading) {
        setIsLoading(true);
        setPetState(null); // Clear pet state while auth is in flux
        return;
    }
    
    // Auth is done, now we can determine AIPet state.
    setIsLoading(false);
    if (profile) {
        // If a profile exists, use its pet state.
        setPetState(profile.aipet_state || null);
    } else {
        // If no profile (e.g., user logged out), ensure pet state is cleared.
        setPetState(null);
    }
  }, [authLoading, profile]);

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

    // FIX: The RPC function expects the parameter to be named 'p_user_id', not 'user_id', consistent with other RPC calls in the app.
    const { data, error } = await supabase.rpc('activate_aipet', {
        p_user_id: user.id
    });

    if (error) {
        throw new Error(`Gagal aktivasi di server: ${error.message}`);
    }
    
    const newPetState = data as AIPetState;

    const getDominantTrait = (p: AIPetPersonalityVector): keyof AIPetPersonalityVector => {
      return (Object.keys(p) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => p[a] > p[b] ? a : b);
    };
    const dominantTrait = getDominantTrait(newPetState.personality);
    // FIX: `dominantTrait` can be inferred as `string | number`. Explicitly cast to string.
    const narrative = await generateAIPetNarrative(newPetState.name, newPetState.tier, String(dominantTrait));
    
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