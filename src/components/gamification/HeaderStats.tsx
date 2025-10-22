// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HeaderStats from '../HeaderStats';
import ProfileDropdown from '../common/ProfileDropdown';
import ThemeToggle from '../common/ThemeToggle';
import { useUI } from '../../contexts/UIContext';

type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'SAVED';

interface HeaderProps {
    saveStatus: SaveStatus;
}

const Header: React.FC<HeaderProps> = ({ saveStatus }) => {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useUI();
    
    const getSaveStatusMessage = () => {
        switch (saveStatus) {
            case 'DIRTY': return 'Mengetik...';
            case 'SAVING': return 'Menyimpan...';
            case 'SAVED': return 'Tersimpan ✓';
            default: return '';
        }
    };

    if (!profile) return null;

    return (
        <header data-onboarding-step="1" className="bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-border-main">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-2">
                        <h1 style={{fontFamily: 'var(--font-display)'}} className="text-3xl font-extrabold tracking-wider text-primary">
                             des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
                        </h1>
                         <div className="text-xs text-text-muted h-5 flex items-center transition-opacity duration-300">
                            {getSaveStatusMessage()}
                        </div>
                    </div>

                    <div className="flex-1 max-w-md mx-4 hidden md:block">
                       <HeaderStats />
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
