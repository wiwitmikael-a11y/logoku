// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const HeaderStats: React.FC = () => {
    const { profile } = useAuth();

    if (!profile) return null;

    const { credits, level, xp } = profile;
    const nextLevelXP = 1000 * level; // Example formula
    const xpPercentage = (xp / nextLevelXP) * 100;

    return (
        <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-full border border-border-main">
            {/* Credits */}
            <div className="flex items-center gap-2" title="Token Kredit">
                <span className="text-xl">🪙</span>
                <span className="font-bold text-text-header">{credits}</span>
            </div>
            
            <div className="h-6 w-px bg-border-main"></div>

            {/* Level & XP */}
            <div className="flex-1 flex items-center gap-3">
                <span className="font-bold text-sm text-primary" title={`Level ${level}`}>LV {level}</span>
                <div className="w-full bg-border-light rounded-full h-2.5" title={`${xp} / ${nextLevelXP} XP`}>
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default HeaderStats;
