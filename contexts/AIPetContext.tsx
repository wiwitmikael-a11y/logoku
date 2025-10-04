// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import * as geminiService from '../services/geminiService';
import type { AIPetState, AIPetStats, AIPetPersonalityVector, AIPetStage } from '../types';

export interface AIPetContextType {
  petState: AIPetState | null;
  isLoading: boolean;
  contextualMessage: string | null;
  setContextualMessage: React.Dispatch<React.SetStateAction<string | null>>;
  notifyPetOfActivity: (activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => void;
  handleInteraction: () => void;
  onGameWin: (game: 'color' | 'pattern' | 'style' | 'slogan') => void;
  updatePetName: (newName: string) => void;
  hatchPet: () => Promise<void>;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

const MAX_STATS: AIPetStats = { energy: 100, creativity: 100, intelligence: 100, charisma: 100 };
const HATCH_COST = 10;

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
    return Math.abs(hash);
};

const createSeededRandom = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280; // Returns a value between 0 and 1
    };
};


export const AIPetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, addXp, deductCredits } = useAuth();
    const [petState, setPetState] = useState<AIPetState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [contextualMessage, setContextualMessage] = useState<string | null>(null);
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
        
        if (profile.aipet_state) {
            const existingState = profile.aipet_state as AIPetState;
            const expectedStage = getStageForLevel(profile.level);
             // Evolve if stage in db is different, or if it's an unhatched egg
            if (existingState.stage !== expectedStage && existingState.stage !== 'egg') {
                 // Trigger evolution logic here in the future
                console.log(`Pet should evolve from ${existingState.stage} to ${expectedStage}`);
                const evolvedState = { ...existingState, stage: expectedStage };
                setPetState(evolvedState);
                savePetStateToDb(evolvedState);
            } else {
                setPetState(existingState);
            }
        } else {
            // NEW PET: Starts as an egg.
            const newPet: AIPetState = {
                name: 'Telur AI',
                stage: 'egg',
                stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
                lastFed: Date.now(),
                lastPlayed: Date.now(),
                personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
                atlas_url: null,
                manifest: null,
                narrative: null,
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
                    if (p.stage === 'egg') return p;
                    const decayRate = 0.1;
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

    useEffect(() => {
        setContextualMessage(null);
    }, [petState?.stage]);

    const hatchPet = useCallback(async () => {
        if (!user || !profile) throw new Error("User not found");
        
        const success = await deductCredits(HATCH_COST);
        if (!success) throw new Error("Token tidak cukup.");
        
        // Step 1: Generate Character Atlas and Assembly Manifest
        const { atlasUrl, manifest } = await geminiService.generateAIPetAtlasAndManifest(user.id);

        // Step 2: Generate initial personality
        const seed = user.id + new Date().toISOString().slice(0, 10);
        const hash = stringToHash(seed);
        const seedRandom = createSeededRandom(hash);
        const personalities: (keyof AIPetPersonalityVector)[] = ['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'];
        const initialPersonality: AIPetPersonalityVector = personalities.reduce((acc, curr) => {
            acc[curr] = Math.floor(seedRandom() * 11); // value 0-10
            return acc;
        }, {} as AIPetPersonalityVector);
        
        const initialStats: AIPetStats = { energy: 100, creativity: 50, intelligence: 50, charisma: 50 };
        const petName = `AIPet-${String(hash).slice(0, 4)}`;

        // Step 3: Generate narrative based on initial state
        const narrative = await geminiService.generateAIPetNarrative({ name: petName, personality: initialPersonality, stats: initialStats });

        // Step 4: Construct the final state
        const hatchedState: AIPetState = {
            name: petName,
            stage: 'child',
            stats: initialStats,
            lastFed: Date.now(),
            lastPlayed: Date.now(),
            personality: initialPersonality,
            narrative: narrative,
            atlas_url: atlasUrl,
            manifest: manifest,
        };
        
        setPetState(hatchedState);
        await savePetStateToDb(hatchedState);
        await addXp(50); // Bonus XP for hatching

    }, [user, profile, deductCredits, addXp, savePetStateToDb]);


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


    const value: AIPetContextType = { petState, isLoading, contextualMessage, setContextualMessage, notifyPetOfActivity, handleInteraction, onGameWin, updatePetName, hatchPet };
    
    return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = (): AIPetContextType => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};