// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import type { AIPetState, AIPetStats } from '../types';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import { useAIPet } from '../contexts/AIPetContext';

// --- PROPS ---
// The component now receives all its state and logic from the context props.
interface AIPetWidgetProps extends ReturnType<typeof useAIPet> {}


// --- CONSTANTS ---
const STAT_MAX = 100;
const GAME_COST = 1; // Token cost to play a game
const GAME_XP_REWARD = 10;
const statIcons: { [key in keyof AIPetStats]: string } = {
  energy: '⚡️',
  creativity: '🎨',
  intelligence: '💡',
};
const statColors: { [key in keyof AIPetStats]: string } = {
  energy: 'bg-yellow-400',
  creativity: 'bg-fuchsia-500',
  intelligence: 'bg-sky-400',
};


// --- HELPER COMPONENTS & FUNCTIONS ---
const StatBar: React.FC<{ stat: keyof AIPetStats; value: number }> = ({ stat, value }) => (
  <div>
    <div className="flex justify-between items-center text-xs mb-1">
      <span className="font-semibold text-text-header">{statIcons[stat]} {stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
      <span className="text-text-muted">{Math.round(value)}/{STAT_MAX}</span>
    </div>
    <div className="w-full bg-background rounded-full h-2.5">
      <div className={`${statColors[stat]} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const getRandomColor = () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

// --- MAIN COMPONENT ---
const AIPetWidget: React.FC<AIPetWidgetProps> = (props) => {
  const { petState, onGameWin, onGameLose, handleInteraction, isInteracting, handlePlayGame } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<'color' | 'pattern' | null>(null);

  if (!petState) return null;

  // --- Visual Logic for the Pet ---
  const petSize = petState.stage === 'egg' ? 40 : 80;
  const energyLevel = petState.stats.energy / STAT_MAX;
  const petColor = `hsl(280, ${energyLevel * 60 + 20}%, ${energyLevel * 40 + 30}%)`;
  const pulseSpeed = 1 + (2 * (1 - energyLevel)); // Faster pulse when low energy

  return (
    <>
      <div className={`fixed bottom-4 left-4 z-40 transition-all duration-300 ${isOpen ? 'w-[300px]' : 'w-16 h-16'}`}>
        {/* Expanded Panel */}
        <div className={`bg-surface border border-border-main rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <header className="p-3 border-b border-border-main flex justify-between items-center">
                <h3 className="text-lg font-bold text-primary">{petState.name}</h3>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-background">&times;</button>
            </header>
            <div className="p-4 space-y-3">
                <div className="flex justify-center items-center h-24">
                  {/* The Pet Visual */}
                  <svg viewBox="0 0 100 100" className={`w-24 h-24 drop-shadow-lg ${isInteracting ? 'animate-aipet-interact' : ''}`} style={{ animation: `aipet-float ${pulseSpeed * 2}s ease-in-out infinite` }} onClick={handleInteraction}>
                      <g style={{ animation: `aipet-pulse ${pulseSpeed}s ease-in-out infinite` }}>
                        <path d="M 50,20 C 80,20 90,40 90,60 C 90,80 80,100 50,100 C 20,100 10,80 10,60 C 10,40 20,20 50,20 Z" fill={petColor} />
                      </g>
                  </svg>
                </div>
                {petState.stage !== 'egg' ? (
                  <>
                    <div className="space-y-2">
                      {Object.keys(petState.stats).map(key => <StatBar key={key} stat={key as keyof AIPetStats} value={petState.stats[key as keyof AIPetStats]} />)}
                    </div>
                    <div className="pt-3 border-t border-border-main grid grid-cols-2 gap-2">
                        <Button size="small" variant="secondary" onClick={() => handlePlayGame('color').then(canPlay => canPlay && setActiveGame('color'))}>Harmoni Warna</Button>
                        <Button size="small" variant="secondary" onClick={() => handlePlayGame('pattern').then(canPlay => canPlay && setActiveGame('pattern'))}>Teka-Teki Pola</Button>
                    </div>
                    <p className="text-center text-xs text-text-muted">Main game: -{GAME_COST} Token, +{GAME_XP_REWARD} XP</p>
                  </>
                ) : (
                    <p className="text-center text-sm text-text-muted">Sebuah telur misterius... Coba klik berulang kali!</p>
                )}
            </div>
        </div>

        {/* Collapsed FAB */}
        <button onClick={() => setIsOpen(true)} className={`absolute bottom-0 right-0 w-16 h-16 bg-surface border-2 border-splash rounded-full shadow-lg flex items-center justify-center transition-opacity duration-300 ${!isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <svg viewBox="0 0 100 100" width={petSize} height={petSize} style={{ animation: `aipet-float ${pulseSpeed * 2}s ease-in-out infinite` }}>
                 <g style={{ animation: `aipet-pulse ${pulseSpeed}s ease-in-out infinite` }}>
                    <path d="M 50,20 C 80,20 90,40 90,60 C 90,80 80,100 50,100 C 20,100 10,80 10,60 C 10,40 20,20 50,20 Z" fill={petColor} />
                 </g>
             </svg>
        </button>
      </div>

      {activeGame && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {activeGame === 'color' && <ColorHarmonyGame onWin={() => { onGameWin({ creativity: 25 }); setActiveGame(null); }} onLose={() => { onGameLose(); setActiveGame(null); }} />}
            {activeGame === 'pattern' && <PatternPuzzleGame onWin={() => { onGameWin({ intelligence: 25 }); setActiveGame(null); }} onLose={() => { onGameLose(); setActiveGame(null); }} />}
         </div>
      )}
    </>
  );
};

// --- Mini-Game Components ---
const ColorHarmonyGame: React.FC<{onWin: ()=>void, onLose: ()=>void}> = ({onWin, onLose}) => {
    const [targetColor, setTargetColor] = useState(getRandomColor());
    const [options, setOptions] = useState<string[]>([]);
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

    useEffect(() => {
        setOptions([getRandomColor(), targetColor, getRandomColor()].sort(() => Math.random() - 0.5));
    }, [targetColor]);

    const handleSelect = (color: string) => {
        if (result) return;
        if (color === targetColor) { setResult('correct'); setTimeout(onWin, 500); }
        else { setResult('wrong'); setTimeout(onLose, 500); }
    };

    return <div className="bg-surface p-6 rounded-lg text-center space-y-4">
        <h4 className="font-bold text-lg text-primary">Harmoni Warna</h4>
        <p className="text-sm">Pilih warna yang cocok dengan ini:</p>
        <div className="w-24 h-24 rounded-md mx-auto" style={{ backgroundColor: targetColor }}></div>
        <div className="flex gap-4 justify-center">
            {options.map(color => <div key={color} onClick={() => handleSelect(color)} className={`w-16 h-16 rounded-md cursor-pointer transition-transform hover:scale-110 ${result === 'correct' && color === targetColor ? 'animate-minigame-correct' : ''}`} style={{backgroundColor: color}}></div>)}
        </div>
        {result === 'wrong' && <p className="text-red-500 font-bold">Yah, salah!</p>}
    </div>;
};

const PatternPuzzleGame: React.FC<{onWin: ()=>void, onLose: ()=>void}> = ({onWin, onLose}) => {
    const onWinRef = React.useRef(onWin);
    useEffect(() => {
        const timer = setTimeout(() => {
            onWinRef.current(); // Auto-win for this placeholder
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return <div className="bg-surface p-6 rounded-lg text-center space-y-4">
        <h4 className="font-bold text-lg text-primary">Teka-Teki Pola</h4>
        <p className="text-sm">Menyusun pola... (Fitur segera hadir)</p>
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-dashed border-primary mx-auto"></div>
    </div>;
}


export default AIPetWidget;