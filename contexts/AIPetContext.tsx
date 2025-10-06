// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { generateAIPetNarrative } from '../services/geminiService';
import type { AIPetState, AIPetStats, AIPetPersonalityVector, AIPetStage, AIPetColors, AIPetBlueprint, AIPetTier, AIPetColorPalette, AIPetBattleStats } from '../types';

export type VisualEffect = { type: 'feed', id: number } | null;

export interface AIPetContextType {
  petState: AIPetState | null;
  isLoading: boolean;
  contextualMessage: string | null;
  showContextualMessage: (message: string | null, duration?: number) => void;
  isPetOnScreen: boolean;
  notifyPetOfActivity: (activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => void;
  handleInteraction: () => void;
  onGameWin: (game: 'color' | 'pattern' | 'style' | 'slogan' | 'intelligence' | 'charisma') => void;
  updatePetName: (newName: string) => void;
  activatePetWithTokens: () => Promise<void>;
  activatePetWithFragments: () => Promise<void>;
  dismantlePet: () => Promise<void>;
  feedPet: () => void;
  visualEffect: VisualEffect;
  clearVisualEffect: () => void;
}

const AIPetContext = createContext<AIPetContextType | undefined>(undefined);

const MAX_STATS: AIPetStats = { energy: 100, creativity: 100, intelligence: 100, charisma: 100 };
const ACTIVATION_COST_TOKENS = 5;
const ACTIVATION_COST_FRAGMENTS = 10;
const DISMANTLE_REWARD_FRAGMENTS = 1;

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

const defaultAIPodState: AIPetState = {
    name: 'AIPod', stage: 'aipod', tier: 'common',
    stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
    lastFed: Date.now(), lastPlayed: Date.now(),
    personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
    narrative: null, blueprint: null, colors: null, battleStats: null, buffs: [],
};

// --- NEW: Centralized Sanitization Function ---
const sanitizePetState = (loadedState: any): AIPetState => {
    const sanitized: AIPetState = { ...defaultAIPodState, ...loadedState };

    // Ensure nested objects and arrays have default values to prevent crashes
    sanitized.stats = { ...defaultAIPodState.stats, ...sanitized.stats };
    sanitized.personality = { ...defaultAIPodState.personality, ...sanitized.personality };
    sanitized.buffs = Array.isArray(sanitized.buffs) ? sanitized.buffs : [];
    sanitized.battleStats = sanitized.battleStats || null;
    sanitized.blueprint = sanitized.blueprint || null;
    sanitized.colors = sanitized.colors || null;
    sanitized.narrative = sanitized.narrative || null;

    return sanitized;
};


export const AIPetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, addXp, deductCredits, refreshProfile } = useAuth();
    const [petState, setPetState] = useState<AIPetState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [contextualMessage, setContextualMessage] = useState<string | null>(null);
    const [isPetOnScreen, setIsPetOnScreen] = useState(false);
    const [visualEffect, setVisualEffect] = useState<VisualEffect>(null);
    const petVisibilityTimer = useRef<number | null>(null);
    const lastUpdateRef = useRef(Date.now());

    const savePetStateToDb = useCallback(async (updates: Partial<{aipet_state: AIPetState} & Pick<import('../types').Profile, 'aipet_pity_counter' | 'data_fragments'>>) => {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);
        if (error) console.error("Failed to save AIPet state:", error);
        await refreshProfile();
    }, [user, refreshProfile]);

    const debouncedSave = useDebounce(savePetStateToDb, 3000);

    const updatePetState = useCallback((updater: (prevState: AIPetState) => AIPetState, skipDebounce = false) => {
        setPetState(prevState => {
            if (!prevState) return null;
            const newState = updater(prevState);
            const updatePayload = { aipet_state: newState };
            if (!skipDebounce) {
                debouncedSave(updatePayload);
            } else {
                savePetStateToDb(updatePayload);
            }
            return newState;
        });
    }, [debouncedSave, savePetStateToDb]);


    useEffect(() => {
        if (profile?.aipet_state) {
            // FIX: Sanitize the state loaded from DB to ensure all properties exist
            const sanitized = sanitizePetState(profile.aipet_state);
            setPetState(sanitized);
        } else if (user && !profile?.aipet_state) {
            // NEW PET: Starts as an aipod.
            setPetState(defaultAIPodState);
            savePetStateToDb({ aipet_state: defaultAIPodState });
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
                    return { ...p, stats: { energy: Math.max(0, p.stats.energy - decayRate * 2), creativity: Math.max(0, p.stats.creativity - decayRate), intelligence: Math.max(0, p.stats.intelligence - decayRate), charisma: Math.max(0, p.stats.charisma - decayRate) }};
                }, true);
                lastUpdateRef.current = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        if (petState) { animationFrameId = requestAnimationFrame(loop); }
        return () => cancelAnimationFrame(animationFrameId);
    }, [petState, updatePetState]);

    useEffect(() => {
        setContextualMessage(null);
    }, [petState?.stage]);

    const showPet = useCallback((duration: number = 20000) => {
        if (petVisibilityTimer.current) clearTimeout(petVisibilityTimer.current);
        setIsPetOnScreen(true);
        petVisibilityTimer.current = window.setTimeout(() => setIsPetOnScreen(false), duration);
    }, []);

    const showContextualMessage = useCallback((message: string | null, duration: number = 20000) => {
        setContextualMessage(message);
        if (message) showPet(duration);
    }, [showPet]);

    const _generateNewPetData = useCallback(async () => {
        if (!user || !profile) throw new Error("User not found");
        
        const seed = user.id + new Date().toISOString().slice(0, 10) + Math.random();
        const hash = stringToHash(seed);
        const seedRandom = createSeededRandom(hash);
        
        const personalities: (keyof AIPetPersonalityVector)[] = ['minimalist', 'rustic', 'playful', 'modern', 'luxury', 'feminine', 'bold', 'creative'];
        const initialPersonality: AIPetPersonalityVector = personalities.reduce((acc, curr) => ({...acc, [curr]: Math.floor(seedRandom() * 11)}), {} as AIPetPersonalityVector);
        const dominantPersonality = (Object.keys(initialPersonality) as Array<keyof AIPetPersonalityVector>).reduce((a, b) => initialPersonality[a] > initialPersonality[b] ? a : b);
        
        const petName = `AIPet-${String(hash).slice(0, 4)}`;

        const blueprints = {
            common: ['Common_Amfibia.png', 'Common_Animalia.png', 'Common_Aves.png', 'Common_Beast.png', 'Common_Dinosaurs.png', 'Common_Dogs.png'],
            epic: ['Epic_Aztec.png', 'Epic_Desert.png', 'Epic_Insects.png', 'Epic_Samurai.png', 'Epic_Siberian.png', 'Epic_Vikings.png'],
            legendary: ['Legendary_Knights.png', 'Legendary_Masked.png', 'Legendary_Predator.png', 'Legendary_Transformer.png'],
            mythic: ['Myth_Archangels.png', 'Myth_Cosmos.png', 'Myth_Daemons.png'],
        };
    
        let rand = seedRandom();
        const pity = profile?.aipet_pity_counter ?? 0;
        if (pity >= 5) { rand = 0.65 + (seedRandom() * 0.35); }

        let selectedTier: AIPetTier;
        if (rand < 0.65) { selectedTier = 'common'; } 
        else if (rand < 0.90) { selectedTier = 'epic'; } 
        else if (rand < 0.99) { selectedTier = 'legendary'; } 
        else { selectedTier = 'mythic'; }
    
        const newPityCounter = selectedTier === 'common' ? pity + 1 : 0;
        
        const tierBlueprints = blueprints[selectedTier];
        const selectedBlueprintUrl = tierBlueprints[hash % tierBlueprints.length];
        const blueprint: AIPetBlueprint = { url: `${GITHUB_ASSETS_URL}AIPets/${selectedBlueprintUrl}` };

        const createColorPalette = (h: number, s: number, l: number, isRare: boolean): AIPetColorPalette => ({
            base: `hsl(${h}, ${s}%, ${l}%)`,
            highlight: `hsl(${h}, ${s}%, ${Math.min(100, l + (isRare ? 20 : 15))}%)`,
            shadow: `hsl(${h}, ${Math.max(0, s - (isRare ? 15 : 10))}%, ${Math.max(0, l - (isRare ? 20 : 15))}%)`,
        });

        const colors: AIPetColors = {
            organic: createColorPalette(seedRandom() * 60, seedRandom()*30+40, seedRandom()*20+40, selectedTier !== 'common'),
            mechanical: createColorPalette(seedRandom() * 360, seedRandom()*40+60, seedRandom()*30+35, selectedTier !== 'common'),
            energy: createColorPalette(seedRandom() * 360, seedRandom()*20+80, seedRandom()*20+50, selectedTier !== 'common'),
        };

        let battleStats: AIPetBattleStats, buffs: string[] = [];
        const [r1, r2, r3, r4] = [seedRandom(), seedRandom(), seedRandom(), seedRandom()];
        switch(selectedTier) {
            case 'mythic': battleStats = { hp: 200+Math.floor(r1*51), atk: 25+Math.floor(r2*11), def: 25+Math.floor(r3*11), spd: 15+Math.floor(r4*11) }; buffs.push('Aura Dewa'); break;
            case 'legendary': battleStats = { hp: 175+Math.floor(r1*41), atk: 20+Math.floor(r2*9), def: 20+Math.floor(r3*9), spd: 12+Math.floor(r4*8) }; buffs.push('Aura Legenda'); break;
            case 'epic': battleStats = { hp: 150+Math.floor(r1*31), atk: 15+Math.floor(r2*11), def: 15+Math.floor(r3*11), spd: 10+Math.floor(r4*6) }; break;
            default: battleStats = { hp: 100+Math.floor(r1*21), atk: 10+Math.floor(r2*6), def: 10+Math.floor(r3*6), spd: 5+Math.floor(r4*6) }; break;
        }
        
        const narrative = await generateAIPetNarrative(petName, selectedTier, dominantPersonality);
    
        const activeState: AIPetState = {
            name: petName, stage: 'active', tier: selectedTier, stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
            lastFed: Date.now(), lastPlayed: Date.now(), personality: initialPersonality, narrative, blueprint, colors, battleStats, buffs,
        };
        
        return { activeState, newPityCounter };
    }, [user, profile]);

    const activatePetWithTokens = useCallback(async () => {
        if (!await deductCredits(ACTIVATION_COST_TOKENS)) throw new Error("Token tidak cukup.");
        const { activeState, newPityCounter } = await _generateNewPetData();
        setPetState(activeState);
        await savePetStateToDb({ aipet_state: activeState, aipet_pity_counter: newPityCounter });
        await addXp(50);
    }, [deductCredits, _generateNewPetData, savePetStateToDb, addXp]);
    
    const activatePetWithFragments = useCallback(async () => {
        const currentFragments = profile?.data_fragments ?? 0;
        if (currentFragments < ACTIVATION_COST_FRAGMENTS) throw new Error("Data Fragment tidak cukup.");
        const { activeState, newPityCounter } = await _generateNewPetData();
        setPetState(activeState);
        await savePetStateToDb({ aipet_state: activeState, aipet_pity_counter: newPityCounter, data_fragments: currentFragments - ACTIVATION_COST_FRAGMENTS });
        await addXp(50);
    }, [profile, _generateNewPetData, savePetStateToDb, addXp]);

    const dismantlePet = useCallback(async () => {
        if (!profile || !petState || petState.tier !== 'common') throw new Error("Hanya pet Common yang bisa didaur ulang.");
        const newFragmentCount = (profile.data_fragments ?? 0) + DISMANTLE_REWARD_FRAGMENTS;
        setPetState(defaultAIPodState);
        await savePetStateToDb({ aipet_state: defaultAIPodState, data_fragments: newFragmentCount });
        await addXp(5);
    }, [profile, petState, savePetStateToDb, addXp]);

    const notifyPetOfActivity = useCallback((activityType: 'designing_logo' | 'generating_captions' | 'project_completed' | 'user_idle' | 'style_choice' | 'forum_interaction', detail?: any) => {
        if (activityType === 'user_idle' && Math.random() < 0.3) { showContextualMessage("Zzz... Kayaknya Juragan lagi istirahat, ya? Aku juga ah.", 10000); } 
        else if (activityType === 'project_completed') { showContextualMessage("Wih, project selesai! Keren banget, Juragan! ✨", 15000); }
        updatePetState(p => { if (p.stage === 'aipod') return p; let newStats = { ...p.stats }; let newPersonality = { ...p.personality };
            switch (activityType) {
                case 'designing_logo': newStats.creativity = Math.min(MAX_STATS.creativity, newStats.creativity + 0.2); break;
                case 'generating_captions': newStats.intelligence = Math.min(MAX_STATS.intelligence, newStats.intelligence + 0.2); break;
                case 'project_completed': newStats = { energy: Math.min(MAX_STATS.energy, newStats.energy + 20), creativity: Math.min(MAX_STATS.creativity, newStats.creativity + 10), intelligence: newStats.intelligence, charisma: newStats.charisma }; break;
                case 'user_idle': newStats.energy = Math.max(0, newStats.energy - 2); break;
                case 'forum_interaction': newStats.charisma = Math.min(MAX_STATS.charisma, newStats.charisma + 0.5); break;
                case 'style_choice': if (detail && newPersonality.hasOwnProperty(detail)) { newPersonality[detail as keyof AIPetPersonalityVector]++; } break;
            } return { ...p, stats: newStats, personality: newPersonality };
        });
    }, [updatePetState, showContextualMessage]);
    
    const handleInteraction = useCallback(() => { updatePetState(p => ({ ...p, stats: { ...p.stats, energy: Math.min(MAX_STATS.energy, p.stats.energy + 1) } })); }, [updatePetState]);
    
    const onGameWin = useCallback((game: 'color' | 'pattern' | 'style' | 'slogan' | 'intelligence' | 'charisma') => {
        addXp(15); updatePetState(p => { if (p.stage === 'aipod') return p; let statToBoost: keyof AIPetStats = 'creativity'; if (game === 'intelligence') statToBoost = 'intelligence'; if (game === 'charisma') statToBoost = 'charisma'; return { ...p, stats: { ...p.stats, [statToBoost]: Math.min(MAX_STATS[statToBoost], p.stats[statToBoost] + 15), energy: Math.max(0, p.stats.energy - 5) }}; });
    }, [updatePetState, addXp]);

    const updatePetName = useCallback((newName: string) => { if (newName.trim()) updatePetState(p => ({ ...p, name: newName.trim() }), true); }, [updatePetState]);

    const feedPet = useCallback(() => {
        updatePetState(p => {
            if (p.stage === 'aipod') return p;
            return {
                ...p,
                stats: { ...p.stats, energy: Math.min(MAX_STATS.energy, p.stats.energy + 15) },
                lastFed: Date.now(),
            }
        });
        setVisualEffect({ type: 'feed', id: Date.now() });
    }, [updatePetState]);

    const clearVisualEffect = useCallback(() => setVisualEffect(null), []);

    const value: AIPetContextType = { petState, isLoading, contextualMessage, showContextualMessage, isPetOnScreen, notifyPetOfActivity, handleInteraction, onGameWin, updatePetName, activatePetWithTokens, activatePetWithFragments, dismantlePet, feedPet, visualEffect, clearVisualEffect };
    
    return <AIPetContext.Provider value={value}>{children}</AIPetContext.Provider>;
};

export const useAIPet = (): AIPetContextType => {
  const context = useContext(AIPetContext);
  if (context === undefined) {
    throw new Error('useAIPet must be used within an AIPetProvider');
  }
  return context;
};