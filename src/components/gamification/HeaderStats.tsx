// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const HeaderStats: React.FC = () => {
    const { profile } = useAuth();

    if (!profile) return null;

    const getXpForLevel = (level: number): number => (level - 1) * 750;
    const xpForNextLevel = getXpForLevel(profile.level + 1);
    const progressPercentage = xpForNextLevel > 0 ? (profile.xp / xpForNextLevel) * 100 : 100;


    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-surface p-3 rounded-lg">
                <p className="text-xs text-text-muted">Token Gratis</p>
                <p className="text-xl font-bold text-primary">{profile.credits}</p>
            </div>
            <div className="bg-surface p-3 rounded-lg">
                <p className="text-xs text-text-muted">Level Juragan</p>
                <p className="text-xl font-bold text-accent">{profile.level}</p>
            </div>
            <div className="bg-surface p-3 rounded-lg col-span-2">
                <p className="text-xs text-text-muted">XP</p>
                 <div className="w-full bg-border-main rounded-full h-2.5 mt-2">
                    <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default HeaderStats;
