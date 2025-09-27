
import React from 'react';
import Button from './common/Button';

interface Props {
  onGoogleLogin: () => void;
  isCaptchaSolved: boolean;
  onShowToS: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LoginScreen: React.FC<Props> = ({ onGoogleLogin, isCaptchaSolved, onShowToS }) => {
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

        {/* Wrapper to align logo and text box */}
        <div className="inline-flex flex-col items-stretch mb-8">
          <h1 className="text-5xl font-bold tracking-tighter text-indigo-400 mb-3">
            logo<span className="text-white">.ku</span>
          </h1>
          
          <div className="bg-gray-700/50 py-2 px-4 rounded-lg">
              <p className="text-white text-xs font-semibold tracking-wide text-center">
                  Powered by Atharrazka Core. Built for UMKM Indonesia.
              </p>
          </div>
        </div>

        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Siap bikin brand lo naik kelas, Juragan? Lupakan pusingnya mikirin logo, bingung mau posting apa, atau bayar mahal agensi. Mang AI hadir sebagai partner setia lo! Cuma butuh beberapa menit, kita bakal sulap ide lo jadi logo profesional, persona brand yang kuat, sampe rentetan konten sosmed siap pakai. Ini bukan sekadar aplikasi, ini studio branding di saku lo. Hemat waktu, hemat biaya, saatnya bisnis lo jadi juara!
        </p>
        
        <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3 mb-8 max-w-sm mx-auto text-sm text-yellow-200">
          <p><strong className="font-bold">Info Penting:</strong> Aplikasi ini masih dalam tahap <em>gacor</em>-in, jadi kalo ada yang aneh-aneh dikit, maklum ya! Mang AI lagi semangat-semangatnya belajar, nih. Sokin, kita mulai petualangannya!</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={onGoogleLogin} 
            disabled={!isCaptchaSolved}
            title={!isCaptchaSolved ? "Selesaikan puzzle captcha dulu!" : "Masuk dengan akun Google"}
          >
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
          <button 
            onClick={isCaptchaSolved ? onShowToS : undefined} 
            disabled={!isCaptchaSolved}
            className="text-indigo-400 hover:underline focus:outline-none disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            Ketentuan Layanan
          </button>{' '}
          kami.
           {!isCaptchaSolved && <span className="block text-yellow-400 text-[11px] mt-1">Selesaikan puzzle di atas dulu, Juragan!</span>}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
