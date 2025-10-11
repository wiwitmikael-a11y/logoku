// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

type Language = 'id' | 'en';
type Translations = { [key in Language]: string };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('desainfun_language') as Language) || 'id';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('desainfun_language', lang);
    document.documentElement.lang = lang;
  }, []);
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((translations: Translations): string => {
    return translations[language] || translations['id'];
  }, [language]);

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
