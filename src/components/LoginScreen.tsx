// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { playSound, resumeAudioContext } from '../services/soundService';
import WelcomeGate from './common/PuzzleCaptchaModal';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWelcomeGate, setShowWelcomeGate] = useState(true);

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        await resumeAudioContext();
        playSound('click');
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Gagal login. Coba lagi.');
            setIsLoading(false);
        }
    };
    
    if (showWelcomeGate) {
        return <WelcomeGate onGatePassed={() => setShowWelcomeGate(false)} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-grid-background bg-center p-4">
             <div className="max-w-md w-full bg-surface/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center border border-border-main animate-content-fade-in">
                <div className="relative w-24 h-24 mx-auto mb-4 animate-breathing-ai">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
                </div>
                <h1 style={{fontFamily: 'var(--font-display)'}} className="text-5xl font-extrabold tracking-wider text-primary">
                    des<span className="text-accent">ai</span>n<span className="text-text-header">.fun</span>
                </h1>
                <p className="mt-2 text-text-muted">Studio Branding AI untuk UMKM Juara</p>
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="mt-8 w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow transition-colors"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span>Menunggu Google...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 2.76-2.21 5.12-4.63 6.72l7.46 5.76c4.35-4 7.23-9.98 7.23-16.44z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4235" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.46-5.77c-2.11 1.44-4.78 2.28-7.92 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                            <span>Lanjutkan dengan Google</span>
                        </>
                    )}
                </button>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
             </div>
        </div>
    );
};

export default LoginScreen;
