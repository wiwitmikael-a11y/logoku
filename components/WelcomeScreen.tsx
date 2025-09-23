import React from 'react';
import Button from './common/Button';

interface Props {
  onEnter: () => void;
}

const GITHUB_ASSETS_URL = 'https://raw.githubusercontent.com/wiwitmikael-a11y/logoku-assets/main/';

// Characters for the background layer
const backgroundAis = [
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-24' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-32' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-28' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-20' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-36' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-24' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-28' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-20' },
];

// Characters for the foreground layer (on top of the disclaimer)
const foregroundAis = [
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-28' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-40' },
  { src: `${GITHUB_ASSETS_URL}Mang_AI.png`, size: 'w-24' },
];

const WelcomeScreen: React.FC<Props> = ({ onEnter }) => {
  // The custom Button component automatically handles unlocking the audio context on the first click.
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
      
      {/* Background Layer (z-0) */}
      <div className="absolute inset-0 z-0">
        {backgroundAis.map((ai, index) => (
          <img
            key={`bg-${index}`}
            src={ai.src}
            alt=""
            className={`${ai.size} absolute animate-float opacity-0`}
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              animationDuration: `${15 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 15}s`,
            }}
          />
        ))}
      </div>

      {/* Content Layer (z-10) */}
      <div className="relative z-10 max-w-2xl w-full bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center animate-fade-in-content">
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
        
        <Button onClick={onEnter} className="px-8 py-4 text-lg font-bold transform hover:scale-105">
          Yaudah, Gaskeun Branding!
        </Button>
      </div>

       {/* Foreground Layer (z-20) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {foregroundAis.map((ai, index) => (
          <img
            key={`fg-${index}`}
            src={ai.src}
            alt=""
            className={`${ai.size} absolute animate-float opacity-0`}
            style={{
              top: `${Math.random() * 85}%`,
              left: `${Math.random() * 85}%`,
              animationDuration: `${10 + Math.random() * 8}s`, // Faster animation
              animationDelay: `${Math.random() * 5}s`, // Start sooner
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
