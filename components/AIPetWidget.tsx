// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import type { AIPetContextType } from '../contexts/AIPetContext';
import { useAuth } from '../contexts/AuthContext';
import AIPetVisual from './AIPetVisual';
import { playSound } from '../services/soundService';

type MiniGame = 'color' | 'pattern' | 'style' | 'slogan' | null;

interface Props extends AIPetContextType {
    isOpen: boolean;
    onClose: () => void;
    onShowHome: () => void;
}

const AIPetWidget: React.FC<Props> = ({ petState, isLoading, onGameWin, isOpen, onClose, onShowHome }) => {
    const { deductCredits, profile } = useAuth();
    const [activeGame, setActiveGame] = useState<MiniGame>(null);
    const [gameFeedback, setGameFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const MINIGAME_COST = 1;

    // --- Color Harmony Game ---
    const [colorTarget, setColorTarget] = useState('');
    const [colorOptions, setColorOptions] = useState<string[]>([]);
    
    // --- Pattern Puzzle Game ---
    const [patternTarget, setPatternTarget] = useState<number[]>([]);
    const [patternOptions, setPatternOptions] = useState<number[][]>([]);
    
    const startGame = async (game: MiniGame) => {
        if (!game) return;
        if ((profile?.credits ?? 0) < MINIGAME_COST) {
            alert("Token lo kurang buat main, Juragan!");
            return;
        }

        const success = await deductCredits(MINIGAME_COST);
        if (!success) return;
        
        playSound('start');
        setActiveGame(game);
        
        if (game === 'color') {
            const generateRandomColor = () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
            const target = generateRandomColor();
            const options = [target, generateRandomColor(), generateRandomColor()].sort(() => Math.random() - 0.5);
            setColorTarget(target);
            setColorOptions(options);
        } else if (game === 'pattern') {
            const sequence = Array.from({length: 3}, () => Math.floor(Math.random() * 4));
            setPatternTarget(sequence);
            const wrongOption1 = sequence.map(v => (v + Math.floor(Math.random()*3) + 1) % 4);
            const wrongOption2 = sequence.map(v => (v + Math.floor(Math.random()*3) + 1) % 4);
            const options = [sequence, wrongOption1, wrongOption2].sort(() => Math.random() - 0.5);
            setPatternOptions(options);
        }
    };

    const handleGameAnswer = (answer: string | number[]) => {
        const isCorrect = Array.isArray(answer) 
            ? JSON.stringify(answer) === JSON.stringify(patternTarget)
            : answer === colorTarget;

        if (isCorrect) {
            playSound('success');
            setGameFeedback('correct');
            onGameWin(activeGame!);
        } else {
            playSound('error');
            setGameFeedback('incorrect');
        }

        setTimeout(() => {
            setGameFeedback(null);
            setActiveGame(null);
        }, 1000);
    };

    if (isLoading || !petState || !isOpen) return null;
    
    const renderPattern = (sequence: number[]) => {
        const symbols = ['■', '●', '▲', '◆'];
        return sequence.map(i => symbols[i]).join(' ');
    };

    return (
        <div className={`fixed bottom-8 left-8 w-80 bg-surface/80 backdrop-blur-md border border-border-main rounded-xl shadow-lg p-4 z-30 transition-all duration-300 origin-bottom-left ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
             <div className="flex justify-between items-center pb-2 border-b border-border-main">
                <h3 className="font-bold text-text-header">{petState.name}</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-header">&times;</button>
             </div>
             
             {!activeGame ? (
                 <div className="mt-3 space-y-3 animate-content-fade-in">
                    <div className="text-xs space-y-2">
                        <div>
                            <p>⚡ Energi ({Math.round(petState.stats.energy)}%)</p>
                            <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-green-500 h-2 rounded-full" style={{width: `${petState.stats.energy}%`}}></div></div>
                        </div>
                        <div>
                            <p>🎨 Kreativitas ({Math.round(petState.stats.creativity)}%)</p>
                            <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-sky-400 h-2 rounded-full" style={{width: `${petState.stats.creativity}%`}}></div></div>
                        </div>
                         <div>
                            <p>🧠 Kecerdasan ({Math.round(petState.stats.intelligence)}%)</p>
                            <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-fuchsia-500 h-2 rounded-full" style={{width: `${petState.stats.intelligence}%`}}></div></div>
                        </div>
                        <div>
                            <p>😎 Karisma ({Math.round(petState.stats.charisma)}%)</p>
                            <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-yellow-400 h-2 rounded-full" style={{width: `${petState.stats.charisma}%`}}></div></div>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-border-main">
                         <p className="text-xs text-text-muted mb-2">Aktivitas (-{MINIGAME_COST} Token, +XP)</p>
                         <div className="grid grid-cols-2 gap-2">
                            <button onClick={onShowHome} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">🏠 Lihat Rumah</button>
                            <button onClick={() => startGame('color')} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">Harmoni Warna</button>
                            <button onClick={() => startGame('pattern')} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">Teka-Teki Pola</button>
                            <button disabled title="Segera Hadir!" className="text-sm bg-background p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Tebak Gaya</button>
                         </div>
                    </div>
                 </div>
             ) : (
                <div className="mt-3 animate-content-fade-in">
                    {activeGame === 'color' && (
                        <div>
                            <p className="text-sm text-center mb-3">Pilih warna yang sama:</p>
                            <div className="w-16 h-16 mx-auto rounded-md mb-4" style={{ backgroundColor: colorTarget, animation: gameFeedback === 'correct' ? 'minigame-correct 0.5s' : '' }}></div>
                            <div className="grid grid-cols-3 gap-2">
                                {colorOptions.map(color => <button key={color} onClick={() => handleGameAnswer(color)} className="h-12 rounded-md" style={{backgroundColor: color}}></button>)}
                            </div>
                        </div>
                    )}
                    {activeGame === 'pattern' && (
                         <div>
                            <p className="text-sm text-center mb-3">Lengkapi polanya:</p>
                            <p className="text-2xl text-center font-mono tracking-widest p-3 bg-background rounded-md mb-4" style={{animation: gameFeedback === 'correct' ? 'minigame-correct 0.5s' : ''}}>{renderPattern(patternTarget)}</p>
                            <div className="grid grid-cols-1 gap-2">
                                {patternOptions.map((opt, i) => <button key={i} onClick={() => handleGameAnswer(opt)} className="font-mono text-lg bg-background hover:bg-border-light p-2 rounded-md">{renderPattern(opt)}</button>)}
                            </div>
                        </div>
                    )}
                     {gameFeedback === 'incorrect' && <p className="text-center text-red-500 font-bold mt-3 animate-pulse">Salah!</p>}
                </div>
             )}
        </div>
    );
};

export default AIPetWidget;