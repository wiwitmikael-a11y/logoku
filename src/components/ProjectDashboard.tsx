// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import AICreator from './AICreator';
import ProjectSummary from './ProjectSummary';
import { Project } from '../types';
import HeaderStats from './gamification/HeaderStats';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import ThemeToggle from './common/ThemeToggle';
import { useUserActions } from '../contexts/UserActionsContext';

interface Props {
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
}

const ProjectDashboard: React.FC<Props> = ({ onToggleTheme, theme }) => {
  const { projects, setProjects, profile } = useAuth();
  const { toggleProfileModal } = useUI();
  const { checkForNewAchievements } = useUserActions();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(projects[0] || null);
  
  React.useEffect(() => {
    if (projects.length > 0) {
      checkForNewAchievements(projects.length);
    }
  }, [projects, checkForNewAchievements]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
           <h1 style={{fontFamily: 'var(--font-display)'}} className="text-4xl font-extrabold text-primary">
                des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
           </h1>
           <p className="text-sm text-text-muted">Selamat datang kembali, Juragan {profile?.full_name?.split(' ')[0]}!</p>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button onClick={() => toggleProfileModal(true)} className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors" title="Pengaturan & Profil">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
        </div>
      </header>
      <HeaderStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <AICreator selectedProject={selectedProject} setSelectedProject={setSelectedProject} projects={projects} setProjects={setProjects} />
        </div>
        <div>
          <ProjectSummary project={selectedProject} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
