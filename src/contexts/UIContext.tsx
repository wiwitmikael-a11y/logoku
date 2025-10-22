// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface CrossComponentPrompt {
  targetTool: 'Studio Foto';
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
  crossComponentPrompt: CrossComponentPrompt | null;
  setCrossComponentPrompt: (prompt: CrossComponentPrompt | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('desainfun_theme');
    return (savedTheme as Theme) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showToSModal, setShowToSModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [crossComponentPrompt, setCrossComponentPrompt] = useState<CrossComponentPrompt | null>(null);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('desainfun_theme', newTheme);
      return newTheme;
    });
  }, []);

  const value: UIContextType = {
    theme,
    toggleTheme,
    showAboutModal,
    toggleAboutModal: setShowAboutModal,
    showContactModal,
    toggleContactModal: setShowContactModal,
    showToSModal,
    toggleToSModal: setShowToSModal,
    showPrivacyModal,
    togglePrivacyModal: setShowPrivacyModal,
    crossComponentPrompt,
    setCrossComponentPrompt,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
