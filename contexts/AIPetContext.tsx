// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { AIPetState, AIPetStats, AIPetPersonalityVector, AIPetStage } from '../types';

export interface AIPetContextType {
  petState: AIPetState | null;
  isLoading: boolean;
  notifyPetOfActivity: (activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => void;
  handleInteraction: () => void;
  onGameWin: (game: 'color' | 'pattern' | 'style' | 'slogan') => void;
  updatePetName: (newName: string) => void;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

const MAX_STATS: AIPetStats = { energy: 100, creativity: 100, intelligence: 100, charisma: 100 };

const getStageForLevel = (level: number): AIPetStage => {
    if (level < 5) return 'child';
    if (level < 10) return 'teen';
    return 'adult';
};

const useDebounce = <F extends (...args: any[]) => any>(callback: F, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: Parameters<F>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
};

// --- Seeded Random Generation ---
const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const createSeededRandom = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280; // Returns a value between 0 and 1
    };
};


export const AIPetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, addXp } = useAuth();
    const [petState, setPetState] = useState<AIPetState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastUpdateRef = useRef(Date.now());

    const savePetStateToDb = useCallback(async (stateToSave: AIPetState) => {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update({ aipet_state: stateToSave })
            .eq('id', user.id);
        if (error) console.error("Failed to save AIPet state:", error);
    }, [user]);

    const debouncedSave = useDebounce(savePetStateToDb, 3000);

    const updatePetState = useCallback((updater: (prevState: AIPetState) => AIPetState, skipDebounce = false) => {
        setPetState(prevState => {
            if (!prevState) return null;
            const newState = updater(prevState);
            if (!skipDebounce) {
                debouncedSave(newState);
            } else {
                savePetStateToDb(newState);
            }
            return newState;
        });
    }, [debouncedSave, savePetStateToDb]);


    useEffect(() => {
        if (!profile || !user) {
            setIsLoading(false);
            return;
        }
        const currentStage = getStageForLevel(profile.level);

        if (profile.aipet_state) {
            const existingState = profile.aipet_state as AIPetState;
            // Check for evolution or if stage is still egg (to force evolution)
            if (existingState.stage !== currentStage || existingState.stage === 'egg') {
                const evolvedState = { ...existingState, stage: currentStage };
                setPetState(evolvedState);
                savePetStateToDb(evolvedState);
            } else {
                setPetState(existingState);
            }
        } else {
            // --- NEW PET GENERATION LOGIC ---
            const seed = stringToHash(user.id);
            const seededRandom = createSeededRandom(seed);
            
            const personalities: (keyof AIPetPersonalityVector)[] = ['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'];
            const initialPersonality: AIPetPersonalityVector = personalities.reduce((acc, curr) => {
                acc[curr] = Math.floor(seededRandom() * 11); // Random value between 0-10
                return acc;
            }, {} as AIPetPersonalityVector);

            const initialStats: AIPetStats = {
                energy: 80 + Math.floor(seededRandom() * 21), // 80-100
                creativity: 40 + Math.floor(seededRandom() * 21), // 40-60
                intelligence: 40 + Math.floor(seededRandom() * 21), // 40-60
                charisma: 40 + Math.floor(seededRandom() * 21), // 40-60
            };

            const newPet: AIPetState = {
                name: 'AIPet',
                stage: currentStage,
                stats: initialStats,
                lastFed: Date.now(),
                lastPlayed: Date.now(),
                personality: initialPersonality
            };
            setPetState(newPet);
            savePetStateToDb(newPet);
        }
        setIsLoading(false);
    }, [profile, user, savePetStateToDb]);
    
    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            const now = Date.now();
            if (now - lastUpdateRef.current > 5000) { // Update every 5 seconds
                updatePetState(p => {
                    const decayRate = p.stage === 'egg' ? 0 : 0.1; // Eggs don't lose stats
                    return {
                        ...p,
                        stats: {
                            energy: Math.max(0, p.stats.energy - decayRate * 2),
                            creativity: Math.max(0, p.stats.creativity - decayRate),
                            intelligence: Math.max(0, p.stats.intelligence - decayRate),
                            charisma: Math.max(0, p.stats.charisma - decayRate)
                        }
                    };
                }, true);
                lastUpdateRef.current = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        if (petState) {
          animationFrameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [petState, updatePetState]);

    const notifyPetOfActivity = useCallback((activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => {
        updatePetState(p => {
            if (p.stage === 'egg') return p; // Eggs don't gain stats from activities
            let newStats = { ...p.stats };
            let newPersonality = { ...p.personality };

            switch (activityType) {
                case 'designing_logo': newStats.creativity = Math.min(MAX_STATS.creativity, newStats.creativity + 0.2); break;
                case 'generating_captions': newStats.intelligence = Math.min(MAX_STATS.intelligence, newStats.intelligence + 0.2); break;
                case 'project_completed':
                    newStats.energy = Math.min(MAX_STATS.energy, newStats.energy + 20);
                    newStats.creativity = Math.min(MAX_STATS.creativity, newStats.creativity + 10);
                    break;
                case 'user_idle': newStats.energy = Math.max(0, newStats.energy - 2); break;
                case 'forum_interaction': newStats.charisma = Math.min(MAX_STATS.charisma, newStats.charisma + 0.5); break;
                case 'style_choice': if (detail && newPersonality.hasOwnProperty(detail)) { newPersonality[detail as keyof AIPetPersonalityVector]++; } break;
            }
            return { ...p, stats: newStats, personality: newPersonality };
        });
    }, [updatePetState]);
    
    const handleInteraction = useCallback(() => {
        updatePetState(p => ({
            ...p,
            stats: {
                ...p.stats,
                energy: Math.min(MAX_STATS.energy, p.stats.energy + 1)
            }
        }));
    }, [updatePetState]);
    
    const onGameWin = useCallback((game: 'color' | 'pattern' | 'style' | 'slogan') => {
        addXp(15);
        updatePetState(p => {
             if (p.stage === 'egg') return p;
            let statToBoost: keyof AIPetStats = 'creativity';
            if (game === 'color') statToBoost = 'creativity';
            if (game === 'pattern') statToBoost = 'intelligence';
            if (game === 'style') statToBoost = 'intelligence';
            if (game === 'slogan') statToBoost = 'charisma';
            
            return {
                ...p,
                stats: {
                    ...p.stats,
                    [statToBoost]: Math.min(MAX_STATS[statToBoost], p.stats[statToBoost] + 15),
                    energy: Math.max(0, p.stats.energy - 5)
                }
            };
        });
    }, [updatePetState, addXp]);

    const updatePetName = useCallback((newName: string) => {
        if (!newName.trim()) return;
        updatePetState(p => ({ ...p, name: newName.trim() }), true);
    }, [updatePetState]);


    const value: AIPetContextType = { petState, isLoading, notifyPetOfActivity, handleInteraction, onGameWin, updatePetName };
    
    return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = (): AIPetContextType => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};
