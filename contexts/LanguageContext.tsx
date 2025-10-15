// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

type Language = 'id' | 'en';
type Translations = { [key in Language]: string };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: {id: string; en: string}) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('desainfun_language') as Language) || 'id';
  });

  useEffect(() => {
    const initialLang = profile?.language || localStorage.getItem('desainfun_language') || 'id';
    setLanguageState(initialLang as Language);
    document.documentElement.lang = initialLang;
  }, [profile?.language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('desainfun_language', lang);
    document.documentElement.lang = lang;

    if (user) {
      supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Gagal menyimpan preferensi bahasa:', error);
          } else {
            refreshProfile(); 
          }
        });
    }
  }, [user, refreshProfile]);

  const t = useCallback((translations: {id: string; en: string}): string => {
    return translations[language] || translations['id'];
  }, [language]);

  const contextValue = React.useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
