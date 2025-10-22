// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import ThemeToggle from '../common/ThemeToggle';
import ProfileDropdown from '../common/ProfileDropdown';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const HeaderStats: React.FC = () => {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useUI();

    if (!profile) {
        return (
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-8 h-8" style={{ imageRendering: 'pixelated' }}/>
                     <h1 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
                </div>
            </div>
        );
    }
    
    const xpForNextLevel = 100 * Math.pow(1.5, profile.level - 1);
    const xpProgress = (profile.xp / xpForNextLevel) * 100;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                 <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-8 h-8" style={{ imageRendering: 'pixelated' }}/>
                 <h1 className="hidden sm:block text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
            </div>

            <div className="flex-grow flex items-center justify-end gap-3 sm:gap-6">
                 {/* Level & XP */}
                <div className="flex-grow max-w-xs hidden md:block">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-primary text-sm">Level {profile.level}</span>
                        <span className="text-xs text-text-muted">{profile.xp} / {Math.round(xpForNextLevel)} XP</span>
                    </div>
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
                    </div>
                </div>

                {/* Credits */}
                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full text-sm font-semibold">
                    <span role="img" aria-label="Token">🪙</span>
                    <span className="text-text-header">{profile.credits}</span>
                    <span className="text-text-muted">Token</span>
                </div>
                
                <div className="flex items-center gap-2">
                     <ThemeToggle theme={theme} onToggle={toggleTheme} />
                     <ProfileDropdown />
                </div>
            </div>
        </div>
    );
};

export default HeaderStats;
