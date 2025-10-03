// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect } from 'react';
import { generateBusinessNames } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';

const GENERATION_COST = 1;
const XP_REWARD = 15;

const QuickTools: React.FC = () => {
    const { profile, deductCredits, addXp, setShowOutOfCreditsModal } = useAuth();
    const credits = profile?.credits ?? 0;

    const [category, setCategory] = useState('');
    const [keywords, setKeywords] = useState('');
    const [generatedNames, setGeneratedNames] = useState<string[]>([]);
    const [displayedNames, setDisplayedNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Typing effect for results
    useEffect(() => {
        if (generatedNames.length > 0) {
            setDisplayedNames([]);
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedNames(prev => [...prev, generatedNames[i]]);
                playSound('typing');
                i++;
                if (i >= generatedNames.length) {
                    clearInterval(interval);
                }
            }, 100); // 100ms delay between each name appearing
            return () => clearInterval(interval);
        }
    }, [generatedNames]);


    const handleGenerate = useCallback(async () => {
        if (!category) {
            setError('INSERT_PRODUCT_CATEGORY_FIRST!');
            return;
        }
        if (credits < GENERATION_COST) {
            setShowOutOfCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedNames([]);
        setDisplayedNames([]);
        playSound('start');

        try {
            const result = await generateBusinessNames(category, keywords);
            await deductCredits(GENERATION_COST);
            await addXp(XP_REWARD);
            setGeneratedNames(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'SYSTEM_ERROR');
        } finally {
            setIsLoading(false);
        }
    }, [category, keywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Warung Ide Arcade 🕹️</h2>
                <p className="text-gray-400">
                    Butuh inspirasi cepat? Di sini tempatnya! Mang AI sediain alat-alat bantu praktis buat kebutuhan branding dadakan lo.
                </p>
            </div>

            <div className="arcade-monitor">
                <div className="crt-screen p-6 flex flex-col gap-4 overflow-y-auto">
                    <h3 className="text-2xl text-yellow-400 font-bold animate-pulse text-center font-mono">NAME GENERATOR v1.0</h3>
                    
                    <div className="flex-grow space-y-4">
                        <div className="space-y-2">
                             <label className="text-cyan-400 font-bold text-sm block">PRODUCT/SERVICE:</label>
                             <input 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Kopi Susu Gula Aren"
                                required
                                className="w-full font-mono bg-black/50 border-2 border-cyan-400/50 rounded-none p-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                             />
                        </div>
                         <div className="space-y-2">
                             <label className="text-cyan-400 font-bold text-sm block">KEYWORDS (OPTIONAL):</label>
                             <input 
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="e.g., senja, santai, modern"
                                className="w-full font-mono bg-black/50 border-2 border-cyan-400/50 rounded-none p-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                             />
                        </div>

                         <button onClick={handleGenerate} disabled={!category || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isLoading ? 'LOADING...' : `START GAME (${GENERATION_COST} TOKEN)`}
                        </button>
                    </div>

                    <div className="flex-grow min-h-[200px] border-t-2 border-cyan-400/30 pt-4 overflow-y-auto">
                        {isLoading && (
                            <div className="text-center text-yellow-400">
                                <p>MANG AI IS THINKING<span className="blinking-cursor">...</span></p>
                            </div>
                        )}
                        {error && <p className="text-red-500 font-bold animate-pulse">ERROR: {error}</p>}
                        
                        {displayedNames.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                {displayedNames.map((name, index) => (
                                     <div key={index} className="flex items-center gap-2 animate-content-fade-in">
                                         <span className="text-cyan-400 font-bold">&gt;</span>
                                         <span className="text-white flex-grow selectable-text">{name}</span>
                                         <CopyButton textToCopy={name} className="!bg-black/50 !text-cyan-400 hover:!bg-cyan-900/50" />
                                     </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="text-center text-xs text-cyan-400/50">
                        <p>MANG AI SYSTEMS - READY PLAYER ONE - +{XP_REWARD} XP</p>
                    </div>
                </div>
            </div>

             <Card title="Generator Slogan (Coming Soon)">
                 <p className="text-sm text-gray-500 italic">
                    Lagi diracik sama Mang AI. Nanti di sini lo bisa bikin slogan keren cuma modal nama bisnis dan beberapa kata kunci. Ditunggu ya!
                </p>
            </Card>
        </div>
    );
};

export default QuickTools;