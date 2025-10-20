// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Tooltip from '../common/Tooltip';

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
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="stat-card-gradient p-2 rounded-lg flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <div>
                    <p className="text-xs text-text-muted">Token</p>
                    <p className="text-xl font-bold text-primary">{profile.credits}</p>
                </div>
            </div>
            <div className="stat-card-gradient p-2 rounded-lg flex items-center gap-2">
                 <span className="text-2xl">⭐</span>
                 <div>
                    <p className="text-xs text-text-muted">Level</p>
                    <p className="text-xl font-bold text-accent">{profile.level}</p>
                </div>
            </div>
            <div className="flex-grow stat-card-gradient p-2 rounded-lg flex items-center gap-2">
                <p className="text-xs font-semibold text-text-muted">XP</p>
                <Tooltip text={`${profile.xp} / ${xpForNextLevel}`}>
                     <div className="w-full bg-border-main rounded-full h-2.5">
                        <div 
                            className="bg-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progressPercentage}%`, background: 'linear-gradient(90deg, rgb(var(--c-accent)) 0%, rgb(var(--c-accent-hover)) 100%)' }}
                        ></div>
                    </div>
                </Tooltip>
            </div>
        </div>
    );
};

export default HeaderStats;