// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const Sidebar: React.FC = () => {
    const { profile } = useAuth();

    // This is a sample sidebar structure. The main app currently uses HeaderStats and ProjectDock.
    // This can be integrated if a sidebar layout is desired in the future.

    return (
        <aside className="w-64 bg-surface border-r border-border-main flex flex-col p-4">
            <div className="flex items-center gap-2 mb-8">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-8 h-8" style={{ imageRendering: 'pixelated' }}/>
                <h1 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h1>
            </div>

            <nav className="flex-grow">
                <ul>
                    <li><a href="#" className="sidebar-link sidebar-link-active">Dashboard</a></li>
                    <li><a href="#" className="sidebar-link">Pusat Juragan</a></li>
                    <li><a href="#" className="sidebar-link">Bantuan</a></li>
                </ul>
            </nav>

            <div className="mt-auto">
                {profile && <ProfileDropdown />}
            </div>
        </aside>
    );
};

export default Sidebar;
