// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import ProjectDock from './ProjectDock';
import HeaderStats from './gamification/HeaderStats';
import AICreator from './AICreator';
import Footer from './common/Footer';
import Newsticker from './common/Newsticker';
import InfoTicker from './common/InfoTicker';
import DonationTicker from './common/DonationTicker';

const ProjectDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();
  
  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-body font-sans">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border-main">
        <HeaderStats />
        <Newsticker />
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {/* AICreator will manage the project state internally */}
        <AICreator />
      </main>

      {/* Project Dock for switching projects */}
      <ProjectDock />
      
      {/* Informational Tickers */}
      <InfoTicker />
      <DonationTicker />

      <Footer 
        onShowAbout={() => toggleAboutModal(true)}
        onShowContact={() => toggleContactModal(true)}
        onShowToS={() => toggleToSModal(true)}
        onShowPrivacy={() => togglePrivacyModal(true)}
      />
    </div>
  );
};

export default ProjectDashboard;
