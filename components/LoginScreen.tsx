// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { Suspense } from 'react';
import Button from './common/Button';
import { getSupabaseClient } from '../services/supabaseClient';
import { useUI } from '../contexts/UIContext';
import { useTranslation } from '../contexts/LanguageContext';

interface Props {
  isCaptchaSolved: boolean;
  isReadyForLogin: boolean;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC<Props> = ({ isCaptchaSolved, isReadyForLogin }) => {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body transition-colors duration-300 overflow-hidden">
      <div className="max-w-xl w-full relative">
        <div className="relative h-40 mb-4 z-10">
            <img
            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
            alt="Mang AI tersandung kabel"
            className="w-40 h-40 absolute bottom-0 left-1/2 -translate-x-1/2 animate-tripped-ai"
            style={{ imageRendering: 'pixelated' }}
            />
        </div>

        <div className="relative z-10">
            <div className="inline-flex flex-col items-center mb-6">
              <h1 style={{fontFamily: 'var(--font-display)'}} className="text-6xl md:text-7xl font-extrabold tracking-wider text-primary mb-2">
                des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
              </h1>
              <p className="text-xl text-text-muted -mt-2" style={{ fontFamily: 'var(--font-hand)' }}>by @rangga.p.h</p>
              <p className="font-semibold text-text-muted mt-2">{t({ id: "Studio Branding AI untuk UMKM Juara", en: "AI Branding Studio for Champion SMEs" })}</p>
            </div>

            <p className="text-text-body mb-8 max-w-lg mx-auto">
              {t({ 
                id: "Pusing mikirin logo, konten sosmed, atau kemasan produk? Tenang, Juragan! Mang AI siap jadi partner setia lo. Ubah ide sederhana jadi", 
                en: "Struggling with logos, social media content, or product packaging? Relax, Boss! Mang AI is here to be your loyal partner. Turn simple ideas into a" 
              })} <strong className="text-text-header">{t({ id: "paket branding lengkap", en: "complete branding package" })}</strong>: {t({ id: "mulai dari", en: "from" })} <strong className="text-primary">{t({ id: "logo", en: "logos" })}</strong>, <strong className="text-primary">{t({ id: "persona brand", en: "brand personas" })}</strong>, <strong className="text-primary">{t({ id: "kalender konten", en: "content calendars" })}</strong>, {t({ id: "sampai", en: "to" })} <strong className="text-primary">{t({ id: "desain kemasan", en: "packaging designs" })}</strong>. {t({ id: "Asah kreativitasmu di", en: "Hone your creativity in" })} <strong className="text-splash">Sotoshop</strong> {t({ id: "dan ngobrol bareng sesama UMKM di", en: "and chat with fellow SMEs in the" })} <strong className="text-splash">Forum</strong>. {t({ id: "Siap naik kelas?", en: "Ready to level up?" })}
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={handleGoogleLogin} 
                disabled={!isCaptchaSolved}
                title={!isCaptchaSolved ? t({ id: "Selesaikan puzzle captcha dulu!", en: "Solve the captcha puzzle first!" }) : t({ id: "Masuk dengan akun Google", en: "Sign in with Google" })}
                size="large"
                className={`!bg-[rgb(var(--c-bg-inverse))] !text-[rgb(var(--c-text-inverse))] border-2 border-border-main hover:!bg-border-light shadow-lg ${isReadyForLogin ? 'animate-button-ready' : ''}`}
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
                onClick={isCaptchaSolved ? () => toggleToSModal(true) : undefined} 
                disabled={!isCaptchaSolved}
                className="text-primary hover:underline focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t({ id: "Ketentuan Layanan", en: "Terms of Service" })}
              </button> & <button 
                onClick={isCaptchaSolved ? () => togglePrivacyModal(true) : undefined} 
                disabled={!isCaptchaSolved}
                className="text-primary hover:underline focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t({ id: "Kebijakan Privasi", en: "Privacy Policy" })}
              </button>.
               {!isCaptchaSolved && <span className="block text-accent font-semibold text-sm mt-2">{t({ id: "Selesaikan puzzle di atas dulu, Juragan!", en: "Solve the puzzle above first, Boss!" })}</span>}
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
