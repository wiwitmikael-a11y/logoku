// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { playSound } from '../../services/soundService';
import Button from './Button';

interface WelcomeGateProps {
  onGatePassed: () => void;
}

const WelcomeGate: React.FC<WelcomeGateProps> = ({ onGatePassed }) => {
  const [isVerified, setIsVerified] = useState(false);

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
            <div className="relative h-40 mb-4 z-10 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary animate-breathing-ai" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>

            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-text-header mb-2">Selamat Datang di desain.fun!</h1>
                <p className="text-text-body mb-6 max-w-lg mx-auto">
                  Pusing mikirin logo, konten sosmed, atau kemasan produk? Tenang, Juragan! Mang AI siap jadi partner setia lo. Ubah ide sederhana jadi <strong className="text-text-header">paket branding lengkap</strong>.
                </p>
                
                <div className="p-4 bg-surface rounded-xl border border-border-main">
                    <h2 className="text-xl font-bold text-primary mb-2">Verifikasi Dulu, Juragan!</h2>
                    <p className="text-sm text-text-muted mb-4">Untuk memastikan Anda bukan robot, dan untuk klaim token harianmu!</p>
                    <div className="p-4 bg-accent/10 rounded-lg text-sm text-accent mb-4">
                        <p><strong>✨ Info Penting:</strong> Setiap hari Juragan dapat jatah token gratis untuk berkreasi sepuasnya!</p>
                    </div>

                    {isVerified ? (
                        <div className="bg-green-500/20 text-green-400 p-3 rounded-md">
                        ✓ Terverifikasi! Siap-siap...
                        </div>
                    ) : (
                        <Button
                        onClick={handleVerify}
                        size="large"
                        variant="primary"
                        className="w-full"
                        >
                        Masuk & Mulai Berkreasi!
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WelcomeGate;