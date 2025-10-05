// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { generateAIPetNarrative } from '../services/geminiService';
import type { AIPetState, AIPetStats, AIPetPersonalityVector, AIPetStage, AIPetColors, AIPetBlueprint, AIPetTier, AIPetColorPalette, AIPetBattleStats } from '../types';

export interface AIPetContextType {
  petState: AIPetState | null;
  isLoading: boolean;
  contextualMessage: string | null;
  setContextualMessage: React.Dispatch<React.SetStateAction<string | null>>;
  notifyPetOfActivity: (activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => void;
  handleInteraction: () => void;
  onGameWin: (game: 'color' | 'pattern' | 'style' | 'slogan') => void;
  updatePetName: (newName: string) => void;
  activatePet: () => Promise<void>;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

const MAX_STATS: AIPetStats = { energy: 100, creativity: 100, intelligence: 100, charisma: 100 };
const ACTIVATION_COST = 5; // Cost for activation.
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

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
            const existingState = { ...profile.aipet_state } as AIPetState;
            let needsDbUpdate = false;

            // Backwards compatibility: add tier if missing
            if (!existingState.tier && existingState.blueprint?.url) {
                const url = existingState.blueprint.url;
                const name = url.substring(url.lastIndexOf('/') + 1);
                existingState.tier = name.split('_')[0].toLowerCase() as AIPetTier;
                needsDbUpdate = true;
            } else if (!existingState.tier) {
                existingState.tier = 'common';
                needsDbUpdate = true;
            }

            // Backwards compatibility: simplify stage from child/teen/adult/hatched to 'active' and 'egg'/'stasis_pod' to 'aipod'
            if (['child', 'teen', 'adult', 'hatched'].includes(existingState.stage)) {
                existingState.stage = 'active';
                needsDbUpdate = true;
            } else if ((existingState.stage as any) === 'egg' || (existingState.stage as any) === 'stasis_pod') {
                existingState.stage = 'aipod';
                if (existingState.name === 'Telur AI' || existingState.name === 'Pod Stasis') {
                    existingState.name = 'AIPod';
                }
                needsDbUpdate = true;
            }


            setPetState(existingState);
            if (needsDbUpdate) {
                savePetStateToDb(existingState);
            }
        } else {
            // NEW PET: Starts as an aipod.
            const newPet: AIPetState = {
                name: 'AIPod',
                stage: 'aipod',
                tier: 'common', // Default tier for an aipod
                stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
                lastFed: Date.now(),
                lastPlayed: Date.now(),
                personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
                narrative: null,
                blueprint: null,
                colors: null,
                battleStats: null,
                buffs: [],
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
                    if (p.stage === 'aipod') return p;
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

    const activatePet = useCallback(async () => {
        if (!user || !profile) throw new Error("User not found");
    
        const success = await deductCredits(ACTIVATION_COST);
        if (!success) throw new Error("Token tidak cukup.");
    
        const seed = user.id + new Date().toISOString().slice(0, 10);
        const hash = stringToHash(seed);
        const seedRandom = createSeededRandom(hash);
        
        const personalities: (keyof AIPetPersonalityVector)[] = ['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'];
        const initialPersonality: AIPetPersonalityVector = personalities.reduce((acc, curr) => {
            acc[curr] = Math.floor(seedRandom() * 11);
            return acc;
        }, {} as AIPetPersonalityVector);
        const dominantPersonality = (Object.keys(initialPersonality) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => initialPersonality[a] > initialPersonality[b] ? a : b);
        
        const initialStats: AIPetStats = { energy: 100, creativity: 50, intelligence: 50, charisma: 50 };
        const petName = `AIPet-${String(hash).slice(0, 4)}`;

        const blueprints = {
            common: [ 'Common_Beast.png', 'Common_Samurai.png', 'Common_Dogs.png', 'Common_Animalia.png', 'Common_Insects.png', 'Common_Dinosaurus.png', 'Common_Unggas.png', 'Common_Amfibia.png' ],
            epic: [ 'Epic_Vikings.png', 'Epic_Siberian.png', 'Epic_Aztec.png', 'Epic_Transformer.png', 'Epic_Masked.png' ],
            mythic: [ 'Myth_Zodiac.png', 'Myth_Predator.png', 'Myth_Desert.png', 'Myth_Olympian.png', 'Myth_Archangel.png', 'Myth_Wayang.png' ],
        };
    
        const rand = seedRandom();
        let selectedTier: AIPetTier;
        let selectedBlueprintUrl: string;
    
        if (rand < 0.5) { // 50%
            selectedTier = 'common';
            selectedBlueprintUrl = blueprints.common[hash % blueprints.common.length];
        } else if (rand < 0.9) { // 40%
            selectedTier = 'epic';
            selectedBlueprintUrl = blueprints.epic[hash % blueprints.epic.length];
        } else { // 10%
            selectedTier = 'mythic';
            selectedBlueprintUrl = blueprints.mythic[hash % blueprints.mythic.length];
        }
    
        const blueprint: AIPetBlueprint = { url: `${GITHUB_ASSETS_URL}AIPets/${selectedBlueprintUrl}` };
        const tier = selectedTier;

        // --- DYNAMIC SHADING COLOR GENERATION ---
        const createColorPalette = (h: number, s: number, l: number, isEpic: boolean): AIPetColorPalette => {
            const highlightModifier = isEpic ? 20 : 15;
            const shadowModifier = isEpic ? 20 : 15;
            const shadowSatModifier = isEpic ? 15 : 10;
            return {
                base: `hsl(${h}, ${s}%, ${l}%)`,
                highlight: `hsl(${h}, ${s}%, ${Math.min(100, l + highlightModifier)}%)`,
                shadow: `hsl(${h}, ${Math.max(0, s - shadowSatModifier)}%, ${Math.max(0, l - shadowModifier)}%)`,
            };
        };

        let organicHue = seedRandom() * 60; // Natural range: Reds, Oranges, Yellows, Browns
        let organicSaturation = seedRandom() * 30 + 40; // 40-70% saturation, not too vibrant
        let organicLightness = seedRandom() * 20 + 40; // 40-60% lightness (mid-tones)

        let mechanicalHue = seedRandom() * 360;
        let mechanicalSaturation = seedRandom() * 40 + 60; // 60-100%, can be vibrant
        let mechanicalLightness = seedRandom() * 30 + 35; // 35-65%, often darker metals

        let energyHue = seedRandom() * 360;
        let energySaturation = seedRandom() * 20 + 80; // 80-100%, very vibrant glow
        let energyLightness = seedRandom() * 20 + 50; // 50-70%, bright but not white

        if (dominantPersonality === 'bold' || dominantPersonality === 'rustic') {
            mechanicalHue = seedRandom() * 60; // Warm metals like bronze, copper
        } else if (dominantPersonality === 'modern' || dominantPersonality === 'minimalist' || dominantPersonality === 'luxury') {
            mechanicalHue = 180 + seedRandom() * 100; // Cool metals like steel, chrome
            organicSaturation = Math.max(0, organicSaturation - 20); // Muted organic colors
        } else if (dominantPersonality === 'playful') {
            mechanicalSaturation = 90; // Extra vibrant mecha parts
            energySaturation = 100;
        }

        const isEpic = tier === 'epic';
        const colors: AIPetColors = {
            organic: createColorPalette(organicHue, organicSaturation, organicLightness, isEpic),
            mechanical: createColorPalette(mechanicalHue, mechanicalSaturation, mechanicalLightness, isEpic),
            energy: createColorPalette(energyHue, energySaturation, energyLightness, isEpic),
        };

        let battleStats: AIPetBattleStats;
        let buffs: string[] = [];
        const rand1 = seedRandom(), rand2 = seedRandom(), rand3 = seedRandom(), rand4 = seedRandom();

        switch(tier) {
            case 'mythic':
                battleStats = { hp: 200 + Math.floor(rand1 * 51), atk: 25 + Math.floor(rand2 * 11), def: 25 + Math.floor(rand3 * 11), spd: 15 + Math.floor(rand4 * 11) };
                buffs.push('Aura Dewa');
                if (rand1 > 0.5) buffs.push('Regen S');
                if (selectedBlueprintUrl.includes('Predator') || selectedBlueprintUrl.includes('Archangel')) { battleStats.atk += 5; buffs.push('Crit Up M'); }
                if (selectedBlueprintUrl.includes('Olympian') || selectedBlueprintUrl.includes('Wayang')) { battleStats.def += 5; buffs.push('Guard Up M'); }
                break;
            case 'epic':
                battleStats = { hp: 150 + Math.floor(rand1 * 31), atk: 15 + Math.floor(rand2 * 11), def: 15 + Math.floor(rand3 * 11), spd: 10 + Math.floor(rand4 * 6) };
                if (rand1 > 0.5) buffs.push('ATK Up S');
                if (selectedBlueprintUrl.includes('Transformer') || selectedBlueprintUrl.includes('Aztec')) { battleStats.def += 3; buffs.push('Defense Mode'); }
                if (selectedBlueprintUrl.includes('Vikings') || selectedBlueprintUrl.includes('Siberian')) { battleStats.atk += 3; buffs.push('Rage'); }
                break;
            default: // common
                battleStats = { hp: 100 + Math.floor(rand1 * 21), atk: 10 + Math.floor(rand2 * 6), def: 10 + Math.floor(rand3 * 6), spd: 5 + Math.floor(rand4 * 6) };
                break;
        }
        
        // Generate narrative
        const narrative = await generateAIPetNarrative(petName, tier, dominantPersonality);
    
        const activeState: AIPetState = {
            name: petName,
            stage: 'active',
            tier: tier,
            stats: initialStats,
            lastFed: Date.now(),
            lastPlayed: Date.now(),
            personality: initialPersonality,
            narrative,
            blueprint,
            colors,
            battleStats,
            buffs,
        };
        
        setPetState(activeState);
        await savePetStateToDb(activeState);
        await addXp(50);

    }, [user, profile, deductCredits, addXp, savePetStateToDb]);


    const notifyPetOfActivity = useCallback((activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => {
        updatePetState(p => {
            if (p.stage === 'aipod') return p; // Pods don't gain stats from activities
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
             if (p.stage === 'aipod') return p;
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


    const value: AIPetContextType = { petState, isLoading, contextualMessage, setContextualMessage, notifyPetOfActivity, handleInteraction, onGameWin, updatePetName, activatePet };
    
    return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = (): AIPetContextType => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};
