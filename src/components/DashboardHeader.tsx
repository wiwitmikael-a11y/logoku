// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HeaderStats from './HeaderStats';
import ProfileDropdown from './common/ProfileDropdown';
import ThemeToggle from './common/ThemeToggle';
import { useUI } from '../contexts/UIContext';
import { useProject } from '../contexts/ProjectContext';
import Newsticker from './common/Newsticker';

const DashboardHeader: React.FC = () => {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useUI();
    const { projects, selectedProject, setSelectedProjectById } = useProject();

    if (!profile || !selectedProject) return null; // Or a minimal header

    return (
        <header data-onboarding-step="1" className="bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-border-main">
             <Newsticker />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                         <h1 style={{fontFamily: 'var(--font-display)'}} className="text-3xl font-extrabold tracking-wider text-primary hidden md:block">
                             des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
                        </h1>
                        {/* Project Selector */}
                        <select
                            value={selectedProject.id}
                            onChange={(e) => setSelectedProjectById(e.target.value)}
                            className="text-lg font-bold bg-transparent text-text-header focus:outline-none"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.project_data.project_name || 'Proyek Tanpa Nama'}
                                </option>
                            ))}
                        </select>
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

export default DashboardHeader;
