
import React, { useRef } from 'react';
import Button from './common/Button';
import { playBGM } from '../services/soundService';

interface Props {
  onEnter: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const WelcomeScreen: React.FC<Props> = ({ onEnter }) => {
  const bgmStarted = useRef(false);

  const handleInteraction = () => {
    // The Button's onMouseEnter now awaits unlockAudio, so this is safe.
    // We just need to play the music once.
    if (!bgmStarted.current) {
      playBGM('welcome');
      bgmStarted.current = true;
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
      
      {/* Content Layer (z-10) */}
      <div className="relative z-10 max-w-2xl w-full bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center animate-fade-in-content">
        
        {/* Top Mario */}
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character"
          className="w-32 absolute -top-24 left-1/2 animate-mario-top-breathing pointer-events-none"
        />

        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-400 tracking-tighter mb-4">
          SEBELUM GASKEUN, BACA DULU BRO!
        </h1>
        <div className="text-gray-300 space-y-4 max-w-lg mb-8">
          <p>
            Ini <strong className="text-white">logo.ku</strong>, studio branding lo bareng <strong className="text-white">Mang AI</strong>. Anggep aja ini temen brainstorming lo yang suka ngopi & ngasih ide-ide ajaib.
          </p>
          <p>
            Mang AI kadang suka ngelawak, jadi hasilnya jangan langsung dicetak di baliho segede gaban ya. <strong className="text-indigo-300">Diliat, dirasa, baru digas!</strong>
          </p>
          <p className="text-xs text-gray-500">
            (Biar seru, app ini ada SFX-nya. Kalo ada suara 'klik' 'ding', jangan kaget. Oke, sip?)
          </p>
        </div>
        
        <Button 
          onClick={onEnter} 
          onMouseEnter={handleInteraction}
          className="px-8 py-4 text-lg font-bold transform hover:scale-105">
          Yaudah, Gaskeun Branding!
        </Button>
      </div>

       {/* Bottom Mario Layer */}
      <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character jumping"
          className="w-36 h-36 object-contain animate-mario-bottom-breathing"
        />
    </div>
  );
};

export default WelcomeScreen;