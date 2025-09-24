import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';

interface Props {
  onShowToS: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC<Props> = ({ onShowToS }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToSAccepted, setIsToSAccepted] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    playSound('start');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href, // Redirect back to the app after login
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.error_description || err.message);
      setLoading(false);
      playSound('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4 overflow-hidden">
       <style>{`
          @keyframes fade-in-content {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-content {
            animation: fade-in-content 0.5s ease-out forwards;
          }
        `}</style>
      
      <div className="relative z-10 max-w-2xl w-full bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center animate-fade-in-content">
        
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character"
          className="w-32 absolute -top-24 left-1/2 animate-mario-top-breathing pointer-events-none"
        />

        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-400 tracking-tighter mb-4">
          SELAMAT DATANG, BRO!
        </h1>
        <div className="text-gray-300 space-y-4 max-w-lg mb-6">
          <p>
            Ini <strong className="text-white">logo.ku</strong>, studio branding lo bareng <strong className="text-white">Mang AI</strong>. Login dulu buat nyimpen semua progres branding lo, jadi bisa lanjut kapan aja, di mana aja.
          </p>
           <p className="bg-gray-900/50 p-3 rounded-lg text-sm">
            Tiap hari lo dapet <strong className="text-yellow-400">10 kredit gratis</strong> buat generate gambar. Kredit ini bakal di-reset otomatis.
           </p>
        </div>
        
        {error && <ErrorMessage message={error} />}

        <div className="flex items-center justify-center space-x-2 my-6">
            <input
                type="checkbox"
                id="tos"
                checked={isToSAccepted}
                onChange={() => setIsToSAccepted(!isToSAccepted)}
                className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="tos" className="text-sm text-gray-400">
                Saya telah membaca & setuju dengan <button onClick={onShowToS} className="text-indigo-400 hover:underline focus:outline-none">Ketentuan Layanan</button>.
            </label>
        </div>

        <Button 
          onClick={handleLogin}
          isLoading={loading}
          disabled={!isToSAccepted || loading}
          className="px-8 py-4 text-lg font-bold transform hover:scale-105">
          Login Pake Google
        </Button>
      </div>
    </div>
  );
};

export default LoginScreen;
