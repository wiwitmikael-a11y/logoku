// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

type Language = 'id' | 'en';
type Translations = { [key in Language]: string };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('desainfun_language') as Language) || 'id';
  });

  // Efek untuk sinkronisasi dari database saat profil dimuat atau berubah
  useEffect(() => {
    if (profile?.language && profile.language !== language) {
      const dbLang = profile.language as Language;
      setLanguageState(dbLang);
      localStorage.setItem('desainfun_language', dbLang);
      document.documentElement.lang = dbLang;
    }
  }, [profile?.language]); // Bergantung pada bahasa di profil


  // Fungsi setLanguage sekarang juga menyimpan ke database
  const setLanguage = useCallback((lang: Language) => {
    // Update state lokal & localStorage seperti biasa
    setLanguageState(lang);
    localStorage.setItem('desainfun_language', lang);
    document.documentElement.lang = lang;

    // Kirim pembaruan ke Supabase jika user sudah login
    if (user) {
      supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Gagal menyimpan preferensi bahasa:', error);
          }
        });
    }
  }, [user]); // Tambahkan user sebagai dependensi

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