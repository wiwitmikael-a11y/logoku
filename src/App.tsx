// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';
import { supabaseError } from './services/supabaseClient';
import { getApiKeyError } from './services/geminiService';

import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import WelcomeGate from './components/common/PuzzleCaptchaModal';
import AboutModal from './components/common/AboutModal';
import ContactModal from './components/common/ContactModal';
import ToSModal from './components/common/TermsOfServiceModal';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import OutOfCreditsModal from './components/common/OutOfCreditsModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import ProfileSettingsModal from './components/common/ProfileSettingsModal';
import PusatJuraganModal from './components/community/PusatJuraganModal';
import { playBGM, stopBGM } from './services/soundService';

const App: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    const { 
        theme, 
        showAboutModal, toggleAboutModal,
        showContactModal, toggleContactModal,
        showToSModal, toggleToSModal,
        showPrivacyModal, togglePrivacyModal,
        showProfileSettingsModal, toggleProfileSettingsModal,
        showPusatJuraganModal, togglePusatJuraganModal,
    } = useUI();
    const { 
        showOutOfCreditsModal, setShowOutOfCreditsModal,
        showLevelUpModal, setShowLevelUpModal, levelUpInfo,
        unlockedAchievement, setUnlockedAchievement
    } = useUserActions();
    
    const [isStuck, setIsStuck] = useState(false);
    const [gatePassed, setGatePassed] = useState(sessionStorage.getItem('desainfun_gate_passed') === 'true');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (authLoading) {
            timer = setTimeout(() => setIsStuck(true), 8000); // 8 seconds timeout
        } else {
            setIsStuck(false);
        }
        return () => clearTimeout(timer);
    }, [authLoading]);

    useEffect(() => {
        if(session && gatePassed) {
           playBGM('welcome');
        } else {
           stopBGM();
        }
        return () => stopBGM(); // Cleanup on unmount or session change
    }, [session, gatePassed]);

    const handleGatePassed = () => {
        setGatePassed(true);
        sessionStorage.setItem('desainfun_gate_passed', 'true');
    };

    if (getApiKeyError()) return <ApiKeyErrorScreen error={getApiKeyError()!} />;
    if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
    if (authLoading) return <AuthLoadingScreen isStuck={isStuck} />;

    return (
        <>
            {session ? (
                gatePassed ? (
                    <ProjectDashboard />
                ) : (
                    <WelcomeGate onGatePassed={handleGatePassed} />
                )
            ) : (
                <LoginScreen />
            )}

            {/* Global Modals & Toasts */}
            <AboutModal show={showAboutModal} onClose={() => toggleAboutModal(false)} />
            <ContactModal show={showContactModal} onClose={() => toggleContactModal(false)} />
            <ToSModal show={showToSModal} onClose={() => toggleToSModal(false)} />
            <PrivacyPolicyModal show={showPrivacyModal} onClose={() => togglePrivacyModal(false)} />
            <ProfileSettingsModal show={showProfileSettingsModal} onClose={() => toggleProfileSettingsModal(false)} />
            <PusatJuraganModal show={showPusatJuraganModal} onClose={() => togglePusatJuraganModal(false)} />
            
            <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
            {levelUpInfo && <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />}
            {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />}
        </>
    );
};

export default App;
