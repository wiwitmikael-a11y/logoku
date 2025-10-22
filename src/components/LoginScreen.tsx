// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { playSound, unlockAudio } from '../services/soundService';
import Button from './common/Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC = () => {
  const handleLogin = async () => {
    await unlockAudio();
    playSound('start');
    const supabase = getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-text-body transition-colors duration-300 overflow-hidden">
        <div className="max-w-xl w-full relative z-10">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`} 
                alt="Mang AI Mascot" 
                className="w-40 h-40 mx-auto mb-4 animate-breathing-ai"
                style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="text-5xl font-bold text-text-header mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun
            </h1>
            <p className="text-text-body mb-8 max-w-lg mx-auto">
              Studio branding AI untuk UMKM juara. Ubah ide jadi brand siap tanding dalam hitungan menit.
            </p>
            
            <Button
              onClick={handleLogin}
              size="large"
              variant="splash"
              className="w-full max-w-xs mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              Masuk dengan Google
            </Button>
        </div>
    </div>
  );
};

export default LoginScreen;
