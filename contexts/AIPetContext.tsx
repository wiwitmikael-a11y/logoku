// FIX: Created this file to resolve "not a module" errors. It provides the AIPetContext, AIPetProvider, and useAIPet hook.
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AIPetState } from '../types';

// This type is used in AIPetVisual.tsx
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
  const [petState, setPetState] = useState<AIPetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPetOnScreen, setIsPetOnScreen] = useState(true);
  const [contextualMessage, showContextualMessage] = useState<string | null>(null);
  const [visualEffect, setVisualEffect] = useState<VisualEffect | null>(null);

  const notifyPetOfActivity = useCallback((activity: string, detail?: string) => {
    console.log(`AIPet activity: ${activity}`, detail);
  }, []);
  
  const clearVisualEffect = useCallback(() => {
    setVisualEffect(null);
  }, []);

  const activatePetWithTokens = useCallback(async () => {
    console.log('activatePetWithTokens called');
  }, []);

  const value: AIPetContextType = {
    petState,
    isLoading,
    isPetOnScreen,
    setIsPetOnScreen,
    notifyPetOfActivity,
    contextualMessage,
    showContextualMessage,
    visualEffect,
    clearVisualEffect,
    activatePetWithTokens,
  };

  return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = () => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};
