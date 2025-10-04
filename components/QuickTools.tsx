// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect } from 'react';
import { generateBusinessNames, generateQuickSlogans, generateMoodboardText, generateMoodboardImages } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';

const NAME_GEN_COST = 1;
const SLOGAN_GEN_COST = 1;
const MOODBOARD_GEN_COST = 3;
const XP_REWARD = 15;

interface QuickToolsProps {}

const QuickTools: React.FC<QuickToolsProps> = () => {
    const { profile, deductCredits, addXp, setShowOutOfCreditsModal } = useAuth();
    const credits = profile?.credits ?? 0;
    
    const [activeTool, setActiveTool] = useState<'name' | 'slogan' | 'moodboard'>('name');

    // Name Gen State
    const [nameCategory, setNameCategory] = useState('');
    const [nameKeywords, setNameKeywords] = useState('');

    // Slogan Gen State
    const [sloganBusinessName, setSloganBusinessName] = useState('');
    const [sloganKeywords, setSloganKeywords] = useState('');
    
    // Moodboard Gen State
    const [moodboardKeywords, setMoodboardKeywords] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);

    // Shared State
    const [results, setResults] = useState<{ title: string; items: string[] } | null>(null);
    const [displayedItems, setDisplayedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Typing effect for results
    useEffect(() => {
        if (results && results.items.length > 0) {
            setDisplayedItems([]);
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedItems(prev => [...prev, results.items[i]]);
                playSound('typing');
                i++;
                if (i >= results.items.length) {
                    clearInterval(interval);
                    playSound('success');
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [results]);


    const handleGenerateNames = useCallback(async () => {
        if (!nameCategory) { setError('PRODUCT/SERVICE CANNOT BE EMPTY!'); return; }
        if (credits < NAME_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateBusinessNames(nameCategory, nameKeywords);
            await deductCredits(NAME_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `IDEAS FOR "${nameCategory.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [nameCategory, nameKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);
    
    const handleGenerateSlogans = useCallback(async () => {
        if (!sloganBusinessName) { setError('BUSINESS NAME CANNOT BE EMPTY!'); return; }
        if (credits < SLOGAN_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateQuickSlogans(sloganBusinessName, sloganKeywords);
            await deductCredits(SLOGAN_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `SLOGANS FOR "${sloganBusinessName.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [sloganBusinessName, sloganKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);
    
    const handleGenerateMoodboard = useCallback(async () => {
        if (!moodboardKeywords) { setError('KEYWORDS CANNOT BE EMPTY!'); return; }
        if (credits < MOODBOARD_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setMoodboardResult(null); playSound('start');
        try {
            const [textData, images] = await Promise.all([
                generateMoodboardText(moodboardKeywords),
                generateMoodboardImages(moodboardKeywords),
            ]);
            await deductCredits(MOODBOARD_GEN_COST); await addXp(XP_REWARD + 10);
            setMoodboardResult({ ...textData, images });
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [moodboardKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    const handleToolChange = (tool: 'name' | 'slogan' | 'moodboard') => {
        setActiveTool(tool); setError(null); setResults(null); setDisplayedItems([]); setMoodboardResult(null);
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-splash mb-2">Warung Ide Arcade 🕹️</h2>
                <p className="text-text-muted">
                    Butuh inspirasi cepat? Di sini tempatnya! Mang AI sediain alat-alat bantu praktis buat kebutuhan branding dadakan lo.
                </p>
            </div>

            <div className="arcade-wrapper">
                <div className="arcade-cabinet">
                    <div className="arcade-top">
                        <h2 className="arcade-title">Warung Ide</h2>
                    </div>
                    <div className="arcade-monitor-frame">
                        <div className="crt-screen p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
                            
                            {/* --- TABS --- */}
                            <div className="flex border-b-2 border-splash/50">
                                <button onClick={() => handleToolChange('name')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'name' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>NAME GEN</button>
                                <button onClick={() => handleToolChange('slogan')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'slogan' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>SLOGAN GEN</button>
                                <button onClick={() => handleToolChange('moodboard')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'moodboard' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>MOODBOARD</button>
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                {activeTool === 'name' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">PRODUCT/SERVICE:</label><input value={nameCategory} onChange={(e) => setNameCategory(e.target.value)} placeholder="e.g., Kopi Susu Gula Aren" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS (OPTIONAL):</label><input value={nameKeywords} onChange={(e) => setNameKeywords(e.target.value)} placeholder="e.g., senja, santai, modern" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateNames} disabled={!nameCategory || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${NAME_GEN_COST} TOKEN)`}</button>
                                    </div>
                                ) : activeTool === 'slogan' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">BUSINESS NAME:</label><input value={sloganBusinessName} onChange={(e) => setSloganBusinessName(e.target.value)} placeholder="e.g., Kopi Senja" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS (OPTIONAL):</label><input value={sloganKeywords} onChange={(e) => setSloganKeywords(e.target.value)} placeholder="e.g., santai, temen ngobrol" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateSlogans} disabled={!sloganBusinessName || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${SLOGAN_GEN_COST} TOKEN)`}</button>
                                    </div>
                                ) : ( // Moodboard
                                     <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS/VIBE:</label><input value={moodboardKeywords} onChange={(e) => setMoodboardKeywords(e.target.value)} placeholder="e.g., rustic coffee shop, sunset, warm" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateMoodboard} disabled={!moodboardKeywords || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${MOODBOARD_GEN_COST} TOKEN)`}</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-h-[200px] border-t-2 border-splash/30 pt-4 overflow-y-auto">
                                {isLoading && <p className="text-center text-yellow-400">MANG AI IS THINKING<span className="blinking-cursor">...</span></p>}
                                {error && <p className="text-red-500 font-bold animate-pulse">ERROR: {error}</p>}
                                
                                {activeTool !== 'moodboard' && results && <p className="text-yellow-400 font-bold mb-2">{results.title}<span className="blinking-cursor">_</span></p>}
                                {activeTool !== 'moodboard' && displayedItems.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                        {displayedItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 animate-content-fade-in">
                                                <span className="text-splash font-bold">&gt;</span>
                                                <span className="text-white flex-grow selectable-text">{item}</span>
                                                <CopyButton textToCopy={item} className="!bg-black/50 !text-splash hover:!bg-splash/20" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTool === 'moodboard' && moodboardResult && (
                                    <div className="space-y-4 animate-content-fade-in">
                                        <div>
                                            <p className="text-yellow-400 font-bold">MOOD & FEEL:</p>
                                            <p className="text-white text-sm italic selectable-text">{moodboardResult.description}</p>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">COLOR PALETTE:</p>
                                            <div className="flex gap-2 mt-1">{moodboardResult.palette.map(hex => <div key={hex} title={hex} className="w-6 h-6 border-2 border-splash/50" style={{backgroundColor: hex}}/>)}</div>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">VISUAL INSPIRATION:</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">{moodboardResult.images.map((img, i) => <img key={i} src={img} alt={`Moodboard image ${i+1}`} className="w-full aspect-square object-cover border-2 border-splash/50"/>)}</div>
                                        </div>
                                    </div>
                                )}

                            </div>
                            <p className="text-center text-xs text-splash/50">MANG AI SYSTEMS - READY PLAYER ONE - +{XP_REWARD} XP</p>
                        </div>
                    </div>
                    <div className="control-panel">
                        <div className="joystick"><div className="joystick-base"></div><div className="joystick-stick"><div className="joystick-ball"></div></div></div>
                        <div className="arcade-buttons"><div className="arcade-button red"></div><div className="arcade-button blue"></div><div className="arcade-button yellow"></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickTools;