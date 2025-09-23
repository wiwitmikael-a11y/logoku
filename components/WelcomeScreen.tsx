import React from 'react';
import Button from './common/Button';

interface Props {
  onEnter: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onEnter }) => {
  // The custom Button component automatically handles unlocking the audio context on the first click.
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}</style>
      <div className="max-w-2xl w-full bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center animate-fade-in">
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
    </div>
  );
};

export default WelcomeScreen;
