// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for Sidebar.tsx
import React from 'react';
import { useUI } from '../../contexts/UIContext';
import type { Project } from '../../types';

import ProjectSwitcher from './ProjectSwitcher';
import ProjectSummary from '../ProjectSummary';
import HeaderStats from '../gamification/HeaderStats';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';
import SaveStatusIndicator from './SaveStatusIndicator';

interface Props {
  project: Project | null;
}

const Sidebar: React.FC<Props> = ({ project }) => {
  const { theme, toggleTheme, toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();

  return (
    <aside className="w-80 bg-surface border-r border-border-main flex-shrink-0 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h1 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>
                <span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <ProfileDropdown />
        </div>
      </div>
      
      <HeaderStats />
      
      <div data-onboarding-step="1">
        <ProjectSwitcher />
      </div>

      <ProjectSummary project={project} isLoading={false} />

      <nav className="flex-grow space-y-2">
        {/* Navigation items can be added here if needed */}
      </nav>

      <div className="space-y-2 text-sm">
         <div className="flex items-center justify-between">
            <SaveStatusIndicator />
         </div>
         <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs">
            <button onClick={() => toggleAboutModal(true)} className="text-text-muted hover:text-primary">Tentang</button>
            <button onClick={() => toggleContactModal(true)} className="text-text-muted hover:text-primary">Kontak</button>
            <button onClick={() => toggleToSModal(true)} className="text-text-muted hover:text-primary">Ketentuan</button>
             <button onClick={() => togglePrivacyModal(true)} className="text-text-muted hover:text-primary">Privasi</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
