// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useUI } from '../../contexts/UIContext';
import ThemeToggle from './ThemeToggle';
import ProjectSwitcher from './ProjectSwitcher';
import HeaderStats from '../gamification/HeaderStats';
import ProfileDropdown from './ProfileDropdown';
import SaveStatusIndicator from './SaveStatusIndicator';

const Header: React.FC = () => {
    const { theme, toggleTheme } = useUI();
    
    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-border-main bg-background/95">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                         <h1 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
                    </div>
                    
                    <div className="flex-1 max-w-xs mx-4">
                      <ProjectSwitcher />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex">
                           <HeaderStats />
                        </div>
                        <SaveStatusIndicator />
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
