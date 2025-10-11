// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastState {
  message: string;
  show: boolean;
}

interface UIContextType {
  toast: ToastState;
  showToast: (message: string) => void;
  closeToast: () => void;

  isAssistantOpen: boolean;
  toggleAssistant: (isOpen?: boolean) => void;

  // Modal states and toggles
  showContactModal: boolean;
  toggleContactModal: (show?: boolean) => void;
  showAboutModal: boolean;
  toggleAboutModal: (show?: boolean) => void;
  showToSModal: boolean;
  toggleToSModal: (show?: boolean) => void;
  showPrivacyModal: boolean;
  togglePrivacyModal: (show?: boolean) => void;
  showProfileModal: boolean;
  toggleProfileModal: (show?: boolean) => void;
  showBrandGalleryModal: boolean;
  toggleBrandGalleryModal: (show?: boolean) => void;
  showSotoshop: boolean;
  toggleSotoshop: (show?: boolean) => void;
  showVoiceWizard: boolean;
  toggleVoiceWizard: (show?: boolean) => void;
  showTokenomicsModal: boolean;
  toggleTokenomicsModal: (show?: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({ message: '', show: false });
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToSModal, setShowToSModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBrandGalleryModal, setShowBrandGalleryModal] = useState(false);
  const [showSotoshop, setShowSotoshop] = useState(false);
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  const [showTokenomicsModal, setShowTokenomicsModal] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // Generic toggle function factory
  const createToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => 
    useCallback((show?: boolean) => {
      setter(prev => typeof show === 'boolean' ? show : !prev);
    }, [setter]);

  const value: UIContextType = {
    toast,
    showToast,
    closeToast,
    isAssistantOpen,
    toggleAssistant: createToggle(setAssistantOpen),
    showContactModal,
    toggleContactModal: createToggle(setShowContactModal),
    showAboutModal,
    toggleAboutModal: createToggle(setShowAboutModal),
    showToSModal,
    toggleToSModal: createToggle(setShowToSModal),
    showPrivacyModal,
    togglePrivacyModal: createToggle(setShowPrivacyModal),
    showProfileModal,
    toggleProfileModal: createToggle(setShowProfileModal),
    showBrandGalleryModal,
    toggleBrandGalleryModal: createToggle(setShowBrandGalleryModal),
    showSotoshop,
    toggleSotoshop: createToggle(setShowSotoshop),
    showVoiceWizard,
    toggleVoiceWizard: createToggle(setShowVoiceWizard),
    showTokenomicsModal,
    toggleTokenomicsModal: createToggle(setShowTokenomicsModal),
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