// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import HeaderStats from './gamification/HeaderStats';
import AICreator from './AICreator';
import Footer from './common/Footer';
import Sidebar from './common/Sidebar';

const ProjectDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();
  const [activeView, setActiveView] = useState('Ringkasan');
  
  if (!profile) return null;

  return (
    <div className="flex h-screen bg-background text-text-body font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border-main">
          <HeaderStats />
        </header>

        <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
          <AICreator activeView={activeView} />
        </main>

        <Footer 
          onShowAbout={() => toggleAboutModal(true)}
          onShowContact={() => toggleContactModal(true)}
          onShowToS={() => toggleToSModal(true)}
          onShowPrivacy={() => togglePrivacyModal(true)}
        />
      </div>
    </div>
  );
};

export default ProjectDashboard;