// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { playSound } from '../services/soundService';

type Theme = 'light' | 'dark';

interface CrossComponentPrompt {
    targetTool: string;
    prompt: string;
}

interface UIContextType {
  theme: Theme;
  toggleTheme: () => void;
  showAboutModal: boolean;
  toggleAboutModal: (show: boolean) => void;
  showContactModal: boolean;
  toggleContactModal: (show: boolean) => void;
  showToSModal: boolean;
  toggleToSModal: (show: boolean) => void;
  showPrivacyModal: boolean;
  togglePrivacyModal: (show: boolean) => void;
  showProfileSettingsModal: boolean;
  toggleProfileSettingsModal: (show: boolean) => void;
  showPusatJuraganModal: boolean;
  togglePusatJuraganModal: (show: boolean) => void;
  showDailyMissionsModal: boolean;
  toggleDailyMissionsModal: (show: boolean) => void;
  crossComponentPrompt: CrossComponentPrompt | null;
  setCrossComponentPrompt: React.Dispatch<React.SetStateAction<CrossComponentPrompt | null>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, profile } = useAuth();
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
    const [showPusatJuraganModal, setShowPusatJuraganModal] = useState(false);
    const [showDailyMissionsModal, setShowDailyMissionsModal] = useState(false);
    const [crossComponentPrompt, setCrossComponentPrompt] = useState<CrossComponentPrompt | null>(null);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
        playSound('transition');
    }, []);

    const createModalToggler = (setter: React.Dispatch<React.SetStateAction<boolean>>) => (show: boolean) => {
        playSound('click');
        setter(show);
    };

    return (
        <UIContext.Provider value={{
            theme,
            toggleTheme,
            showAboutModal,
            toggleAboutModal: createModalToggler(setShowAboutModal),
            showContactModal,
            toggleContactModal: createModalToggler(setShowContactModal),
            showToSModal,
            toggleToSModal: createModalToggler(setShowToSModal),
            showPrivacyModal,
            togglePrivacyModal: createModalToggler(setShowPrivacyModal),
            showProfileSettingsModal,
            toggleProfileSettingsModal: createModalToggler(setShowProfileSettingsModal),
            showPusatJuraganModal,
            togglePusatJuraganModal: createModalToggler(setShowPusatJuraganModal),
            showDailyMissionsModal,
            toggleDailyMissionsModal: createModalToggler(setShowDailyMissionsModal),
            crossComponentPrompt,
            setCrossComponentPrompt,
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};