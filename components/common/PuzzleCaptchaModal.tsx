import React, { useState, useRef, useEffect } from 'react';
import { playSound } from '../../services/soundService';

interface Props {
  show: boolean;
  onSuccess: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const PUZZLE_BG_URL = `${GITHUB_ASSETS_URL}mang_ai_puzzle_bg.png`;
const PUZZLE_PIECE_URL = `${GITHUB_ASSETS_URL}mang_ai_puzzle_piece.png`;

const PuzzleCaptchaModal: React.FC<Props> = ({ show, onSuccess }) => {
  const [isSolved, setIsSolved] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    if (show) {
      window.addEventListener('dragover', preventDefault);
      window.addEventListener('drop', preventDefault);
      modalRef.current?.focus();
    }
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, [show]);
  

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.dataTransfer.setData('text/plain', 'puzzle-piece');
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.getData('text/plain') === 'puzzle-piece') {
      playSound('puzzle_drop');
      setIsSolved(true);
      setTimeout(() => {
        onSuccess();
      }, 1000); 
    }
  };
  
  const handleIncorrectDrop = () => {
    playSound('puzzle_fail');
    setIsIncorrect(true);
    setTimeout(() => setIsIncorrect(false), 500);
  };

  if (!show) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="captcha-title"
      tabIndex={-1}
      onDrop={handleIncorrectDrop}
      onDragOver={handleDragOver}
    >
      <div className={`relative max-w-sm w-full bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center transition-all duration-300 ${isSolved ? 'border-green-500 ring-4 ring-green-500/30' : ''} ${isIncorrect ? 'border-red-500 animate-shake' : ''}`}>
        <h2 id="captcha-title" className="text-xl font-bold text-indigo-400 mb-2">Bentar, Juragan!</h2>
        <p className="text-gray-300 mb-6 text-center text-sm">Biar Mang AI yakin lo bukan robot sisa-sisa Skynet, pasangin dulu puzzle ini ke tempatnya ya!</p>

        <div className="relative w-64 h-64 mb-6" style={{ imageRendering: 'pixelated' }}>
          <img src={PUZZLE_BG_URL} alt="Mang AI with a missing piece" className="w-full h-full pointer-events-none" />
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`absolute top-[120px] left-[72px] w-[58px] h-[58px] bg-black/30 border-2 border-dashed transition-colors ${isSolved ? 'border-green-500 bg-green-500/20' : 'border-gray-500 group-hover:border-indigo-400'}`}
            aria-label="Drop zone for puzzle piece"
          >
           {isSolved && (
              <img src={PUZZLE_PIECE_URL} alt="Solved puzzle piece" className="w-full h-full animate-content-fade-in" style={{ imageRendering: 'pixelated' }} />
           )}
          </div>
        </div>

        {!isSolved && (
            <div className="flex flex-col items-center">
                 <p className="text-xs text-gray-400 mb-2">Seret potongan ini ke gambar di atas</p>
                <img
                    src={PUZZLE_PIECE_URL}
                    alt="Draggable puzzle piece of Mang AI"
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="w-16 h-16 cursor-grab active:cursor-grabbing"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        )}

        {isSolved && (
            <p className="text-green-400 font-bold animate-pulse">Sip, Berhasil! Lo emang manusia sejati.</p>
        )}
      </div>
       <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default PuzzleCaptchaModal;
