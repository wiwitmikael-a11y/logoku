// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';
import { getApiKeyError } from './services/geminiService';
import { supabaseError } from './services/supabaseClient';
import { useAudioContextManager } from './hooks/useAudioContextManager';

// --- Screens ---
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';

// --- Modals ---
import AboutModal from './components/common/AboutModal';
import ContactModal from './components/common/ContactModal';
import TermsOfServiceModal from './components/common/TermsOfServiceModal';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import OutOfCreditsModal from './components/common/OutOfCreditsModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import Onboarding from './components/common/Onboarding';

const App: React.FC = () => {
    const { user, loading, isNewUser } = useAuth();
    const { theme, showAboutModal, toggleAboutModal, showContactModal, toggleContactModal, showToSModal, toggleToSModal, showPrivacyModal, togglePrivacyModal } = useUI();
    const { showOutOfCreditsModal, setShowOutOfCreditsModal, showLevelUpModal, setShowLevelUpModal, levelUpInfo, unlockedAchievement, setUnlockedAchievement } = useUserActions();

    const [showOnboarding, setShowOnboarding] = React.useState(false);
    
    useAudioContextManager(); // Initialize and manage audio context globally

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);
    
    useEffect(() => {
        if (isNewUser) {
            const hasSeenOnboarding = localStorage.getItem('desainfun_onboarding_seen');
            if (!hasSeenOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [isNewUser]);

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('desainfun_onboarding_seen', 'true');
    };

    const geminiError = getApiKeyError();
    if (geminiError) {
        return <ApiKeyErrorScreen error={geminiError} />;
    }
    if (supabaseError) {
        return <SupabaseKeyErrorScreen error={supabaseError} />;
    }

    if (loading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-background text-text-body font-sans">
            {user ? <ProjectDashboard /> : <LoginScreen />}

            {/* Global Modals & Toasts */}
            <AboutModal show={showAboutModal} onClose={() => toggleAboutModal(false)} />
            <ContactModal show={showContactModal} onClose={() => toggleContactModal(false)} />
            <TermsOfServiceModal show={showToSModal} onClose={() => toggleToSModal(false)} />
            <PrivacyPolicyModal show={showPrivacyModal} onClose={() => togglePrivacyModal(false)} />
            <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
            {showLevelUpModal && levelUpInfo && (
                <LevelUpModal show={true} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />
            )}
            {unlockedAchievement && (
                <AchievementToast achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />
            )}
            {showOnboarding && <Onboarding onClose={handleOnboardingClose} />}
        </div>
    );
};

export default App;
