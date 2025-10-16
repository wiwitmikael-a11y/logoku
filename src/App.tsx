// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import { supabaseError } from './services/supabaseClient';
import { getAiClient } from './services/geminiService';
import { playSound, playBGM, unlockAudio } from './services/soundService';
import ThemeToggle from './components/common/ThemeToggle';
import Footer from './components/common/Footer';

// Lazy load modals to improve initial load time
const ContactModal = React.lazy(() => import('./components/common/ContactModal'));
const AboutModal = React.lazy(() => import('./components/common/AboutModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const PrivacyPolicyModal = React.lazy(() => import('./components/common/PrivacyPolicyModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const LevelUpModal = React.lazy(() => import('./components/gamification/LevelUpModal'));
const AchievementToast = React.lazy(() => import('./components/gamification/AchievementToast'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));
const VoiceBrandingWizard = React.lazy(() => import('./components/VoiceBrandingWizard'));

const App: React.FC = () => {
  const { session, loading, authError } = useAuth();
  const { showContactModal, toggleContactModal, showAboutModal, toggleAboutModal, showToSModal, toggleToSModal, showPrivacyModal, togglePrivacyModal, showProfileModal, toggleProfileModal, showVoiceWizard, toggleVoiceWizard } = useUI();
  const { showOutOfCreditsModal, setShowOutOfCreditsModal, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement } = useUserActions();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [isGeminiReady, setIsGeminiReady] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  useEffect(() => {
    // Check for Gemini API Key availability
    try {
      getAiClient(); // This will throw if the key is missing
      setIsGeminiReady(true);
    } catch (e) {
      setGeminiError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const handleToggleTheme = useCallback(async () => {
    await unlockAudio();
    playSound('select');
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const handleSuccessfulCaptcha = useCallback(() => {
    setIsCaptchaSolved(true);
    setShowCaptcha(false);
    playBGM('welcome');
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      const timer = setTimeout(() => setShowCaptcha(true), 1500); // Delay captcha appearance
      return () => clearTimeout(timer);
    } else {
      setShowCaptcha(false);
    }
  }, [loading, session]);

  if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
  if (geminiError) return <ApiKeyErrorScreen error={geminiError} />;
  if (authError) return <ApiKeyErrorScreen error={authError} />; // Can use the same screen for auth errors
  if (loading) return <AuthLoadingScreen />;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {session ? (
            <ProjectDashboard onToggleTheme={handleToggleTheme} theme={theme} />
          ) : (
            <>
              {showCaptcha && !isCaptchaSolved && (
                <Suspense fallback={<AuthLoadingScreen />}>
                  <PuzzleCaptchaModal show={true} onSuccess={handleSuccessfulCaptcha} />
                </Suspense>
              )}
              <LoginScreen isCaptchaSolved={isCaptchaSolved} isReadyForLogin={isCaptchaSolved} />
            </>
          )}
        </main>
        {session && (
          <Footer
            onShowAbout={() => toggleAboutModal(true)}
            onShowContact={() => toggleContactModal(true)}
            onShowToS={() => toggleToSModal(true)}
            onShowPrivacy={() => togglePrivacyModal(true)}
          />
        )}
      </div>

      {/* Centralized Modal Rendering */}
      <Suspense fallback={<div />}>
        {showContactModal && <ContactModal show={showContactModal} onClose={() => toggleContactModal(false)} />}
        {showAboutModal && <AboutModal show={showAboutModal} onClose={() => toggleAboutModal(false)} />}
        {showToSModal && <TermsOfServiceModal show={showToSModal} onClose={() => toggleToSModal(false)} />}
        {showPrivacyModal && <PrivacyPolicyModal show={showPrivacyModal} onClose={() => togglePrivacyModal(false)} />}
        {showProfileModal && <ProfileSettingsModal show={showProfileModal} onClose={() => toggleProfileModal(false)} />}
        {showOutOfCreditsModal && <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />}
        {showLevelUpModal && levelUpInfo && <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />}
        {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />}
        {showVoiceWizard && <VoiceBrandingWizard show={showVoiceWizard} onClose={() => toggleVoiceWizard(false)} />}
      </Suspense>
    </>
  );
};

export default App;