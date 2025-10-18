// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { playSound } from '../../services/soundService';
import { useTranslation } from '../../contexts/LanguageContext';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface WelcomeGateProps {
  onGatePassed: () => void;
}

const WelcomeGate: React.FC<WelcomeGateProps> = ({ onGatePassed }) => {
  const [isVerified, setIsVerified] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isVerified) {
      playSound('success');
      const timer = setTimeout(onGatePassed, 500);
      return () => clearTimeout(timer);
    }
  }, [isVerified, onGatePassed]);

  const handleVerify = () => {
    setIsVerified(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body transition-colors duration-300 overflow-hidden animate-content-fade-in">
        <div className="max-w-xl w-full relative">
            <div className="relative h-40 mb-4 z-10">
                <img
                    src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                    alt="Mang AI menyambut"
                    className="w-40 h-40 absolute bottom-0 left-1/2 -translate-x-1/2 animate-breathing-ai"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-text-header mb-2">{t({ id: "Selamat Datang di desain.fun!", en: "Welcome to desain.fun!" })}</h1>
                <p className="text-text-body mb-6 max-w-lg mx-auto">
                  {t({ 
                    id: "Pusing mikirin logo, konten sosmed, atau kemasan produk? Tenang, Juragan! Mang AI siap jadi partner setia lo. Ubah ide sederhana jadi", 
                    en: "Struggling with logos, social media content, or product packaging? Relax, Boss! Mang AI is here to be your loyal partner. Turn simple ideas into a" 
                  })} <strong className="text-text-header">{t({ id: "paket branding lengkap", en: "complete branding package" })}</strong>.
                </p>
                
                <div className="p-4 bg-surface rounded-xl border border-border-main">
                    <h2 className="text-xl font-bold text-primary mb-2">{t({ id: "Verifikasi Dulu, Juragan!", en: "Verify First, Boss!" })}</h2>
                    <p className="text-sm text-text-muted mb-4">{t({ id: "Untuk memastikan Anda bukan robot, dan untuk klaim token harianmu!", en: "To make sure you're not a robot, and to claim your daily tokens!" })}</p>
                    <div className="p-4 bg-accent/10 rounded-lg text-sm text-accent mb-4">
                        <p><strong>✨ Info Penting:</strong> {t({ id: "Setiap hari Juragan dapat jatah token gratis untuk berkreasi sepuasnya!", en: "Every day you get a free token allowance to create to your heart's content!" })}</p>
                    </div>

                    {isVerified ? (
                        <div className="bg-green-500/20 text-green-400 p-3 rounded-md">
                        ✓ {t({ id: "Terverifikasi! Siap-siap...", en: "Verified! Get ready..." })}
                        </div>
                    ) : (
                        <Button
                        onClick={handleVerify}
                        size="large"
                        variant="primary"
                        className="w-full"
                        >
                        {t({ id: "Masuk & Mulai Berkreasi!", en: "Enter & Start Creating!" })}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WelcomeGate;
