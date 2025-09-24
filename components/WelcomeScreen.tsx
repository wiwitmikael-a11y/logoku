import React, { useRef, useState } from 'react';
import Button from './common/Button';
import { playBGM } from '../services/soundService';

interface Props {
  onEnter: () => void;
  onShowToS: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const WelcomeScreen: React.FC<Props> = ({ onEnter, onShowToS }) => {
  const bgmStarted = useRef(false);
  const [isToSAccepted, setIsToSAccepted] = useState(false);

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
        <div className="text-gray-300 space-y-4 max-w-lg mb-6">
          <p>
            Ini <strong className="text-white">logo.ku</strong>, studio branding lo bareng <strong className="text-white">Mang AI</strong>. Anggep aja ini temen brainstorming lo yang suka ngopi & ngasih ide-ide ajaib.
          </p>
          <p>
            Mang AI kadang suka ngelawak, jadi hasilnya jangan langsung dicetak di baliho segede gaban ya. <strong className="text-indigo-300">Diliat, dirasa, baru digas!</strong>
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mb-6">
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
          onClick={onEnter} 
          onMouseEnter={handleInteraction}
          disabled={!isToSAccepted}
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