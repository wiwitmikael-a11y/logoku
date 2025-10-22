// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HeaderStats from './HeaderStats';
import ProfileDropdown from './common/ProfileDropdown';
import { useProject } from '../contexts/ProjectContext';

const DashboardHeader: React.FC = () => {
    const { profile } = useAuth();
    const { selectedProject } = useProject();
    
    if (!profile) return null;

    return (
        <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-border-main">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Project Name */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-text-header truncate" title={selectedProject?.project_data.project_name}>
                           {selectedProject ? selectedProject.project_data.project_name : 'Dashboard'}
                        </h1>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 max-w-lg mx-4 hidden md:block">
                       <HeaderStats />
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-2">
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
