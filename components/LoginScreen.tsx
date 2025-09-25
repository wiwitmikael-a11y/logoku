import React, { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { playSound } from '../services/soundService';
import Button from './common/Button';

interface Props {
  onShowToS: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC<Props> = ({ onShowToS }) => {
  const handleLogin = async (provider: 'google') => {
    playSound('click');
    // We explicitly tell Supabase where to redirect the user back to.
    // window.location.origin provides the base URL (e.g., 'http://localhost:3000' or 'https://your-app.vercel.app')
    // which is exactly what we need for a reliable redirect.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Error logging in:', error.message);
      // TODO: show an error message to the user
    }
  };

  useEffect(() => {
    // Sync sounds with the 'login-ai-antics' animation (7s duration)
    const duration = 7000;
    // Timings (in percentage) of when the character lands in the animation
    const landingTimings = [0.15, 0.32, 0.49, 0.75, 0.95];
    let timeouts: number[] = [];

    const playSoundsForCycle = () => {
      // Clear any previous timeouts to prevent overlap if component re-renders
      timeouts.forEach(clearTimeout);
      timeouts = [];
      // Schedule sounds for the current animation cycle
      landingTimings.forEach(timing => {
        timeouts.push(window.setTimeout(() => playSound('bounce'), timing * duration));
      });
    };

    playSoundsForCycle(); // Play for the first cycle immediately
    const intervalId = setInterval(playSoundsForCycle, duration); // Schedule for subsequent cycles

    // Cleanup function: runs when the component unmounts
    return () => {
      clearInterval(intervalId);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full">
        {/* Container for the animation. h-40 ensures space for jumping. */}
        <div className="relative h-40 mb-4">
            <img
            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
            alt="Mang AI character"
            className="w-40 h-40 absolute bottom-0 left-1/2 animate-login-ai"
            style={{ imageRendering: 'pixelated' }}
            />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-indigo-400 mb-2">
          logo<span className="text-white">.ku</span>
        </h1>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Wih, ada juragan! Pusing mikirin logo atau bingung mau posting apa di sosmed? Tenang, serahin aja sama ahlinya... Mang AI! Di sini, kita bakal ngeracik logo anti-mainstream, nentuin persona brand, sampe bikinin jadwal konten lengkap sama caption-nya. Hemat waktu, hemat biaya, hasilnya dijamin hore!
        </p>
        
        <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3 mb-8 max-w-sm mx-auto text-sm text-yellow-200">
          <p><strong className="font-bold">Info Penting:</strong> Aplikasi ini masih dalam tahap <em>gacor</em>-in, jadi kalo ada yang aneh-aneh dikit, maklum ya! Mang AI lagi semangat-semangatnya belajar, nih. Sokin, kita mulai petualangannya!</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button onClick={() => handleLogin('google')}>
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" aria-hidden="true" focusable="false" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Masuk dengan Google
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-8">
          Dengan masuk, lo setuju sama{' '}
          <button onClick={onShowToS} className="text-indigo-400 hover:underline">
            Ketentuan Layanan
          </button>{' '}
          kami.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;