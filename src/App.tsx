// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import OutOfCreditsModal from './components/common/OutOfCreditsModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import { useUserActions } from './contexts/UserActionsContext';
import { supabaseError } from './services/supabaseClient';
// FIX: Corrected import path. Assumes geminiService.ts exists and exports this function.
import { getApiKeyError } from './services/geminiService';
import { useAudioContextManager } from './hooks/useAudioContextManager';
import { playBGM, stopBGM } from './services/soundService';
import WelcomeGate from './components/common/PuzzleCaptchaModal';
import AdAnchor from './components/common/AdAnchor';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme } = useUI();
  const {
    showOutOfCreditsModal, setShowOutOfCreditsModal,
    showLevelUpModal, setShowLevelUpModal, levelUpInfo,
    unlockedAchievement, setUnlockedAchievement,
  } = useUserActions();
  
  const [gatePassed, setGatePassed] = useState(sessionStorage.getItem('desainfun_gate_passed') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useAudioContextManager();

  useEffect(() => {
    document.documentElement.className = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
      if (gatePassed && user) {
          playBGM('welcome');
          const timer = setTimeout(() => {
              playBGM('LoFi'); // Or random BGM
          }, 4000); // Duration of welcome jingle
          return () => {
              clearTimeout(timer);
              stopBGM();
          }
      }
  }, [gatePassed, user]);
  
  const handleGatePassed = () => {
    sessionStorage.setItem('desainfun_gate_passed', 'true');
    setGatePassed(true);
  };

  const geminiApiKeyError = getApiKeyError();
  if (geminiApiKeyError) return <ApiKeyErrorScreen error={geminiApiKeyError} />;
  if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
  if (loading) return <AuthLoadingScreen />;
  
  const renderContent = () => {
    if (!user) return <LoginScreen />;
    if (!gatePassed) return <WelcomeGate onGatePassed={handleGatePassed} />;
    
    // New layout with Sidebar
    return (
      <div id="app-layout">
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="main-content">
          <ProjectDashboard />
        </main>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      
      {/* Global Modals & Toasts */}
      <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
      {levelUpInfo && <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />}
      {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />}
      
      {/* Global Ad Anchor, shown only after login and gate passed */}
      {user && gatePassed && <AdAnchor />}
    </>
  );
};

export default App;
