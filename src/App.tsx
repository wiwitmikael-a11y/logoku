// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for App.tsx to handle routing and main layout.
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';
import { geminiError } from './services/geminiService';
import { supabaseError } from './services/supabaseClient';

import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import Onboarding from './components/common/Onboarding';
import AboutModal from './components/common/AboutModal';
import ContactModal from './components/common/ContactModal';
import TermsOfServiceModal from './components/common/TermsOfServiceModal';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import OutOfCreditsModal from './components/common/OutOfCreditsModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import WelcomeGate from './components/common/PuzzleCaptchaModal';
import { useAudioContextManager } from './hooks/useAudioContextManager';
import { playBGM, stopBGM } from './services/soundService';

const App: React.FC = () => {
  const { user, loading, isNewUser } = useAuth();
  const { theme, showAboutModal, toggleAboutModal, showContactModal, toggleContactModal, showToSModal, toggleToSModal, showPrivacyModal, togglePrivacyModal } = useUI();
  const { showOutOfCreditsModal, setShowOutOfCreditsModal, showLevelUpModal, setShowLevelUpModal, levelUpInfo, unlockedAchievement, setUnlockedAchievement } = useUserActions();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gatePassed, setGatePassed] = useState(sessionStorage.getItem('desainfun_gate_passed') === 'true');

  useAudioContextManager();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    if (user && isNewUser && gatePassed) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isNewUser, gatePassed]);
  
  useEffect(() => {
    if(gatePassed && user) {
        playBGM('welcome');
    } else if (!user) {
        stopBGM();
    }
  }, [gatePassed, user]);

  const handleGatePassed = () => {
    setGatePassed(true);
    sessionStorage.setItem('desainfun_gate_passed', 'true');
  };

  if (geminiError) return <ApiKeyErrorScreen error={geminiError} />;
  if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
  if (loading) return <AuthLoadingScreen />;
  
  return (
    <>
      <main className="font-sans">
        {!user ? (
          <LoginScreen />
        ) : !gatePassed ? (
          <WelcomeGate onGatePassed={handleGatePassed} />
        ) : (
          <ProjectDashboard />
        )}
      </main>

      {/* Modals & Toasts */}
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <AboutModal show={showAboutModal} onClose={() => toggleAboutModal(false)} />
      <ContactModal show={showContactModal} onClose={() => toggleContactModal(false)} />
      <TermsOfServiceModal show={showToSModal} onClose={() => toggleToSModal(false)} />
      <PrivacyPolicyModal show={showPrivacyModal} onClose={() => togglePrivacyModal(false)} />
      <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
      {levelUpInfo && <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />}
      {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />}
    </>
  );
};

export default App;