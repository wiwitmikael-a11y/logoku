// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const HeaderStats: React.FC = () => {
    const { profile } = useAuth();

    if (!profile) return null;

    const getXpForLevel = (level: number): number => 100 + (level * 150); // Slightly adjusted curve
    const xpForNextLevel = getXpForLevel(profile.level);
    const xpForCurrentLevel = getXpForLevel(profile.level - 1);
    const totalXpInLevel = xpForNextLevel - xpForCurrentLevel;
    const currentXpInLevel = profile.xp - xpForCurrentLevel;
    
    const progressPercentage = totalXpInLevel > 0 ? Math.max(0, Math.min(100, (currentXpInLevel / totalXpInLevel) * 100)) : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card-gradient p-3 rounded-lg flex items-center gap-3">
                <span className="text-3xl">🪙</span>
                <div>
                    <p className="text-xs text-text-muted">Token Gratis</p>
                    <p className="text-2xl font-bold text-primary">{profile.credits}</p>
                </div>
            </div>
            <div className="stat-card-gradient p-3 rounded-lg flex items-center gap-3">
                 <span className="text-3xl">⭐</span>
                 <div>
                    <p className="text-xs text-text-muted">Level Juragan</p>
                    <p className="text-2xl font-bold text-accent">{profile.level}</p>
                </div>
            </div>
            <div className="stat-card-gradient p-3 rounded-lg col-span-2 flex flex-col justify-center">
                 <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-text-muted font-semibold">XP</p>
                    <p className="text-xs font-mono text-accent">{profile.xp} / {xpForNextLevel}</p>
                 </div>
                 <div className="w-full bg-border-main rounded-full h-3.5">
                    <div 
                        className="bg-accent h-3.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progressPercentage}%`, background: 'linear-gradient(90deg, rgb(var(--c-accent)) 0%, rgb(var(--c-accent-hover)) 100%)' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default HeaderStats;