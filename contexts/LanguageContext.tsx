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
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('desainfun_language') as Language) || 'id';
  });

  // Fungsi `useAuth` hanya akan dipanggil di dalam `useEffect` atau `useCallback`
  // yang bergantung pada `user`, untuk memastikan konteksnya sudah tersedia.
  const AuthConsumer = () => {
    const { user, profile } = useAuth();

    // Efek untuk sinkronisasi dari database saat profil dimuat atau berubah
    useEffect(() => {
      if (profile?.language && profile.language !== language) {
        const dbLang = profile.language as Language;
        setLanguageState(dbLang);
        localStorage.setItem('desainfun_language', dbLang);
        document.documentElement.lang = dbLang;
      }
    }, [profile?.language]);

    // Fungsi setLanguage sekarang juga menyimpan ke database
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
            }
          });
      }
    }, [user]);

    const contextValue = React.useMemo(() => ({
      language,
      setLanguage,
      t: (translations: Translations): string => translations[language] || translations['id'],
    }), [language, setLanguage]);

    return (
      <LanguageContext.Provider value={contextValue}>
        {children}
      </LanguageContext.Provider>
    );
  };

  // Komponen wrapper ini memastikan bahwa AuthConsumer hanya dirender
  // sebagai anak dari AuthProvider, sehingga useAuth() akan selalu berhasil.
  return <AuthConsumer />;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
