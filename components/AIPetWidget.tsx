// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, Suspense } from 'react';
import type { AIPetContextType } from '../contexts/AIPetContext';
import { useAuth } from '../contexts/AuthContext';
import AIPetVisual from './AIPetVisual';
import { playSound } from '../services/soundService';

const AIPetHatching = React.lazy(() => import('./AIPetHatching'));

type MiniGame = 'color' | 'pattern' | 'style' | 'slogan' | null;

interface Props extends AIPetContextType {
    isOpen: boolean;
    onClose: () => void;
    onShowHome: () => void;
    onAskPet: () => void;
}

const AIPetWidget: React.FC<Props> = ({ petState, isLoading, onGameWin, isOpen, onClose, onShowHome, onAskPet, updatePetName }) => {
    const { deductCredits, profile } = useAuth();
    const [activeGame, setActiveGame] = useState<MiniGame>(null);
    const [gameFeedback, setGameFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(petState?.name || '');
    const [showHatchingModal, setShowHatchingModal] = useState(false);

    const MINIGAME_COST = 1;

    useEffect(() => {
        if (petState) {
            setNewName(petState.name);
        }
    }, [petState]);

    const handleSaveName = () => {
        if (newName.trim()) {
            updatePetName(newName.trim());
        }
        setIsEditingName(false);
    };

    // --- Game Logic ---
    const [colorTarget, setColorTarget] = useState('');
    const [colorOptions, setColorOptions] = useState<string[]>([]);
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

    const headerContent = () => {
        if (petState.stage === 'egg') {
            return <h3 className="font-bold text-text-header">{petState.name}</h3>;
        }
        if (isEditingName) {
            return (
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                        className="bg-background text-text-header font-bold text-base w-36 px-2 py-1 rounded-md"
                        autoFocus
                    />
                    <button onClick={handleSaveName} className="text-primary hover:text-primary-hover">Simpan</button>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-text-header">{petState.name}</h3>
                <button onClick={() => setIsEditingName(true)} className="text-text-muted hover:text-text-header" title="Ganti Nama">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
            </div>
        );
    };

    const mainContent = () => {
        if (petState.stage === 'egg') {
            return (
                <div className="text-center p-4">
                    <p className="text-sm text-text-body mb-4">Sepertinya ada telur misterius di sini. Mau coba tetaskan?</p>
                    <button onClick={() => setShowHatchingModal(true)} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover">
                        Tetaskan Telur (10 Token)
                    </button>
                </div>
            );
        }

        if (activeGame) {
            return (
                 <div className="mt-3 animate-content-fade-in">
                    {activeGame === 'color' && ( <div> <p className="text-sm text-center mb-3">Pilih warna yang sama:</p> <div className="w-16 h-16 mx-auto rounded-md mb-4" style={{ backgroundColor: colorTarget, animation: gameFeedback === 'correct' ? 'minigame-correct 0.5s' : '' }}></div> <div className="grid grid-cols-3 gap-2"> {colorOptions.map(color => <button key={color} onClick={() => handleGameAnswer(color)} className="h-12 rounded-md" style={{backgroundColor: color}}></button>)} </div> </div> )}
                    {activeGame === 'pattern' && ( <div> <p className="text-sm text-center mb-3">Lengkapi polanya:</p> <p className="text-2xl text-center font-mono tracking-widest p-3 bg-background rounded-md mb-4" style={{animation: gameFeedback === 'correct' ? 'minigame-correct 0.5s' : ''}}>{renderPattern(patternTarget)}</p> <div className="grid grid-cols-1 gap-2"> {patternOptions.map((opt, i) => <button key={i} onClick={() => handleGameAnswer(opt)} className="font-mono text-lg bg-background hover:bg-border-light p-2 rounded-md">{renderPattern(opt)}</button>)} </div> </div> )}
                    {gameFeedback === 'incorrect' && <p className="text-center text-red-500 font-bold mt-3 animate-pulse">Salah!</p>}
                </div>
            );
        }

        return (
             <div className="mt-3 space-y-3 animate-content-fade-in">
                <div className="text-xs space-y-2">
                    <div> <p>⚡ Energi ({Math.round(petState.stats.energy)}%)</p> <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-green-500 h-2 rounded-full" style={{width: `${petState.stats.energy}%`}}></div></div> </div>
                    <div> <p>🎨 Kreativitas ({Math.round(petState.stats.creativity)}%)</p> <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-sky-400 h-2 rounded-full" style={{width: `${petState.stats.creativity}%`}}></div></div> </div>
                    <div> <p>🧠 Kecerdasan ({Math.round(petState.stats.intelligence)}%)</p> <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-fuchsia-500 h-2 rounded-full" style={{width: `${petState.stats.intelligence}%`}}></div></div> </div>
                    <div> <p>😎 Karisma ({Math.round(petState.stats.charisma)}%)</p> <div className="w-full bg-background rounded-full h-2 mt-1"><div className="bg-yellow-400 h-2 rounded-full" style={{width: `${petState.stats.charisma}%`}}></div></div> </div>
                </div>
                <div className="pt-3 border-t border-border-main">
                        <p className="text-xs text-text-muted mb-2">Aktivitas</p>
                        <div className="grid grid-cols-2 gap-2">
                        <button onClick={onAskPet} className="col-span-2 text-sm bg-primary text-white hover:bg-primary-hover p-2 rounded-md font-semibold">Tanya {petState.name}</button>
                        <button onClick={onShowHome} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">🏠 Lihat Rumah</button>
                        <button onClick={() => startGame('color')} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">Harmoni Warna</button>
                        <button onClick={() => startGame('pattern')} className="text-sm bg-background hover:bg-border-light p-2 rounded-md">Teka-Teki Pola</button>
                        <button disabled title="Segera Hadir!" className="text-sm bg-background p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Tebak Gaya</button>
                        </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`pet-menu-popup fixed bottom-[8.5rem] right-8 w-80 bg-surface/80 backdrop-blur-md border border-border-main rounded-xl shadow-lg p-4 z-30 transition-all duration-300 origin-bottom-right animate-content-fade-in`}>
                <div className="flex justify-between items-center pb-2 border-b border-border-main">
                    {headerContent()}
                    <button onClick={onClose} className="text-text-muted hover:text-text-header text-2xl leading-none">&times;</button>
                </div>
                {mainContent()}
            </div>
            {showHatchingModal && (
                <Suspense fallback={null}>
                    <AIPetHatching onClose={() => setShowHatchingModal(false)} />
                </Suspense>
            )}
        </>
    );
};

export default AIPetWidget;
