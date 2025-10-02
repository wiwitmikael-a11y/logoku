// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from '../common/Button';
import type { LevelUpInfo } from '../../contexts/AuthContext';

interface Props {
  show: boolean;
  onClose: () => void;
  levelUpInfo: LevelUpInfo | null;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LevelUpModal: React.FC<Props> = ({ show, onClose, levelUpInfo }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      playSound('success'); // Play level up sound
      modalRef.current?.focus();
    }
  }, [show]);

  if (!show || !levelUpInfo) {
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
  };

  const levelTiers: { [level: number]: string } = {
    5: "Juragan Teras",
    10: "Juragan Distrik",
    20: "Maestro Brand",
    50: "Sultan Branding Nusantara",
  };
  const newTitle = levelTiers[levelUpInfo.newLevel];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-gray-800/80 backdrop-blur-md border border-yellow-500 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center" style={{ animation: 'level-up-modal-scale-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character celebrating"
          className="w-28 mb-4 animate-mang-ai-happy"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="levelup-modal-title" className="text-3xl font-bold text-yellow-400 mb-2">NAIK LEVEL!</h2>
        <p className="text-gray-200 text-lg">
          Selamat, Juragan! Lo sekarang mencapai <strong className="text-white">Level {levelUpInfo.newLevel}</strong>.
        </p>
        {newTitle && (
            <p className="mt-1 text-xl font-handwritten text-yellow-300">Pangkat baru: "{newTitle}"</p>
        )}
        <p className="mt-6 bg-gray-900/50 p-4 rounded-lg">
          Sebagai hadiah, lo dapet tambahan <strong className="text-xl text-yellow-300">{levelUpInfo.tokenReward} Token</strong> gratis!
        </p>
        <div className="mt-8">
            <Button onClick={handleClose}>
                Mantap, Lanjut Berkarya!
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;