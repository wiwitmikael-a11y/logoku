// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ProFeatureModal: React.FC<Props> = ({ show, onClose }) => {
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
      aria-labelledby="pro-feature-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-gray-800/80 backdrop-blur-md border border-purple-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character wearing a crown"
          className="w-28 mb-4"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="pro-feature-modal-title" className="text-2xl font-bold text-purple-400 mb-2">Fitur Khusus Juragan Pro!</h2>
        <p className="text-gray-300 mb-6">
          Sabar, Juragan! Fitur sinkronisasi cloud ini lagi disiapin buat paket <strong className="text-white">logo.ku Pro</strong> yang bakal segera hadir. 
          Biar semua project lo aman dan bisa diakses di mana aja. Ditunggu ya!
        </p>
        <div className="flex flex-col gap-4 items-center">
            <Button onClick={handleClose}>
                Oke, Mang, Ditunggu!
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ProFeatureModal;
