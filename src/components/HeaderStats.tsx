// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import ThemeToggle from './common/ThemeToggle';
import ProfileDropdown from './common/ProfileDropdown';

const HeaderStats: React.FC = () => {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useUI();

    if (!profile) {
        return <div className="h-16"></div>; // Placeholder for loading state
    }
    
    const xpForNextLevel = 100 * Math.pow(1.5, profile.level - 1);
    const xpProgress = (profile.xp / xpForNextLevel) * 100;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-end gap-4">
            {/* Level & XP Bar - Integrated and more compact */}
            <div className="hidden md:flex items-center gap-3 bg-surface px-3 py-1.5 rounded-full text-sm font-semibold">
                <span className="font-bold text-primary">Lv {profile.level}</span>
                <div className="w-24 bg-background h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${xpProgress}%` }}></div>
                </div>
                <span className="text-xs text-text-muted">{profile.xp}/{Math.round(xpForNextLevel)}</span>
            </div>

            {/* Credits */}
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full text-sm font-semibold">
                <span role="img" aria-label="Token" className="text-lg">✨</span>
                <span className="text-text-header">{profile.credits}</span>
            </div>
            
            <div className="flex items-center gap-1">
                 <ThemeToggle theme={theme} onToggle={toggleTheme} />
                 <ProfileDropdown />
            </div>
        </div>
    );
};

export default HeaderStats;