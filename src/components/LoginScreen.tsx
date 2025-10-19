// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Button from './common/Button';
import { getSupabaseClient } from '../services/supabaseClient';
import { useUI } from '../contexts/UIContext';
import { useTranslation } from '../contexts/LanguageContext';

const LoginScreen: React.FC = () => {
  const { toggleToSModal, togglePrivacyModal } = useUI();
  const { t } = useTranslation();

  const handleGoogleLogin = () => {
    try {
      const supabase = getSupabaseClient();
      supabase.auth.signInWithOAuth({ 
          provider: 'google', 
          options: { redirectTo: window.location.origin }
      });
    } catch (error) {
        console.error("Supabase client could not be initialized:", error);
        alert(`Gagal memulai proses login: ${(error as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body transition-colors duration-300 overflow-hidden animate-content-fade-in">
      <div className="max-w-xl w-full relative">
        <div className="relative z-10">
            <div className="inline-flex flex-col items-center mb-6">
              <h1 style={{fontFamily: 'var(--font-display)'}} className="text-6xl md:text-7xl font-extrabold tracking-wider text-primary mb-2">
                des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
              </h1>
              <p className="font-semibold text-text-muted mt-2">{t({ id: "Ubah Ide Jadi Brand Juara dalam Hitungan Menit", en: "Turn Ideas Into Champion Brands in Minutes" })}</p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={handleGoogleLogin} 
                title={t({ id: "Masuk dengan akun Google", en: "Sign in with Google" })}
                size="large"
                className="!bg-[rgb(var(--c-bg-inverse))] !text-[rgb(var(--c-text-inverse))] border-2 border-border-main hover:!bg-border-light shadow-lg animate-button-ready"
              >
                <svg className="w-5 h-5" aria-hidden="true" focusable="false" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {t({ id: "Masuk dengan Google", en: "Sign in with Google" })}
              </Button>
            </div>
            
            <p className="text-xs text-text-muted mt-4">
              {t({ id: "Dengan masuk, lo setuju sama", en: "By signing in, you agree to the" })}{' '}
              <button 
                onClick={() => toggleToSModal(true)} 
                className="text-primary hover:underline focus:outline-none"
              >
                {t({ id: "Ketentuan Layanan", en: "Terms of Service" })}
              </button> & <button 
                onClick={() => togglePrivacyModal(true)} 
                className="text-primary hover:underline focus:outline-none"
              >
                {t({ id: "Kebijakan Privasi", en: "Privacy Policy" })}
              </button>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;