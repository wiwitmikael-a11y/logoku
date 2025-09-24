import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

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
          Jatah 'kopi item' Mang AI buat gambar-gambar udah abis buat hari ini, bro. Gak bisa mikir lagi doi. Coba lagi besok ya, jatahnya bakal diisi ulang otomatis!
        </p>
        <Button onClick={handleClose}>
            Oke, Mang, Istirahat Dulu
        </Button>
      </div>
    </div>
  );
};

export default OutOfCreditsModal;