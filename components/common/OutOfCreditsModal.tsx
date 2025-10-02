import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/desainfun-assets@main/';

const OutOfCreditsModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }

  const handleClose = async () => {
      await unlockAudio();
      playSound('click');
      onClose();
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          handleClose();
      }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-gray-800/80 backdrop-blur-md border border-yellow-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character looking tired"
          className="w-28 mb-4 filter grayscale"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="credits-modal-title" className="text-2xl font-bold text-yellow-400 mb-2">Waduh, Amunisi Mang AI Abis!</h2>
        <p className="text-gray-300 mb-6">
          Jatah <span className="font-bold text-white">5 token harian</span> lo udah abis, bro. Coba lagi besok ya, jatahnya bakal diisi ulang otomatis!
        </p>
        <div className="flex flex-col gap-4 items-center">
            <Button onClick={handleClose}>
                Oke, Mang, Besok Lagi
            </Button>
            <div className="w-full text-center p-3 bg-gray-900/50 rounded-lg">
                 <p className="text-xs text-gray-400 mb-2">Butuh token tanpa batas & gak mau nunggu?</p>
                 <Button 
                    variant="secondary" 
                    size="small" 
                    disabled={true} 
                    title="Segera Hadir!" 
                    className="!border-amber-500/50 !text-amber-300 hover:!bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                     Upgrade ke Paket Pro (Segera Hadir)
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OutOfCreditsModal;