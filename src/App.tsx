// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
// FIX: Corrected imports for components
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import AboutModal from './components/common/AboutModal';
import ContactModal from './components/common/ContactModal';
import TermsOfServiceModal from './components/common/TermsOfServiceModal';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import OutOfCreditsModal from './components/common/OutOfCreditsModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import { useUserActions } from './contexts/UserActionsContext';
import { supabaseError } from './services/supabaseClient';
import { getApiKeyError } from './services/geminiService';
import { useAudioContextManager } from './hooks/useAudioContextManager';
import { playBGM, stopBGM } from './services/soundService';
import WelcomeGate from './components/common/PuzzleCaptchaModal';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const {
    theme,
    showAboutModal, toggleAboutModal,
    showContactModal, toggleContactModal,
    showToSModal, toggleToSModal,
    showPrivacyModal, togglePrivacyModal,
  } = useUI();

  const {
    showOutOfCreditsModal, setShowOutOfCreditsModal,
    showLevelUpModal, setShowLevelUpModal, levelUpInfo,
    unlockedAchievement, setUnlockedAchievement,
  } = useUserActions();
  
  const [gatePassed, setGatePassed] = useState(sessionStorage.getItem('desainfun_gate_passed') === 'true');

  useAudioContextManager();

  useEffect(() => {
    // FIX: This is the critical fix. The theme is controlled by a 'data-theme' attribute, not a class.
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
  
  return (
    <>
      {!user ? (
        <LoginScreen />
      ) : !gatePassed ? (
        <WelcomeGate onGatePassed={handleGatePassed} />
      ) : (
        <ProjectDashboard />
      )}
      
      {/* Global Modals & Toasts */}
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
