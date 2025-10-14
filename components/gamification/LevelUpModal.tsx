// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from '../common/Button';
// FIX: Changed import path for LevelUpInfo type
import type { LevelUpInfo } from '../../contexts/UserActionsContext';

interface Props {
  show: boolean;
  onClose: () => void;
  levelUpInfo: LevelUpInfo | null;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LevelUpModal: React.FC<Props> = ({ show, onClose, levelUpInfo }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (show) { playSound('success'); modalRef.current?.focus(); } }, [show]);
  if (!show || !levelUpInfo) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); };

  const levelTiers: { [level: number]: string } = { 5: "Juragan Teras", 10: "Juragan Distrik", 20: "Maestro Brand", 50: "Sultan Branding Nusantara", };
  const newTitle = levelTiers[levelUpInfo.newLevel];
  const animation = ` @keyframes level-up-modal-scale-in { from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } } @keyframes mang-ai-happy { 0% { transform: scale(1) translateY(0) rotate(0deg); } 20% { transform: scale(1.05, 0.95) translateY(0); } 50% { transform: scale(0.95, 1.05) translateY(-8px) rotate(5deg); } 80% { transform: scale(1.05, 0.95) translateY(0) rotate(-5deg); } 100% { transform: scale(1) translateY(0) rotate(0deg); } } .animate-mang-ai-happy { animation: mang-ai-happy 1.5s ease-in-out infinite; transform-origin: bottom center; } `;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-modal-title"
      tabIndex={-1}
    >
        <style>{animation}</style>
      <div className="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-surface border border-splash/50 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center" style={{ animation: 'level-up-modal-scale-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI celebrating" className="w-28 mb-4 animate-mang-ai-happy" style={{ imageRendering: 'pixelated' }} />
        <h2 id="levelup-modal-title" className="text-4xl font-bold text-splash mb-2" style={{ fontFamily: 'var(--font-display)' }}>NAIK LEVEL!</h2>
        <p className="text-text-body text-lg"> Selamat, Juragan! Lo sekarang mencapai <strong className="text-text-header">Level {levelUpInfo.newLevel}</strong>. </p>
        {newTitle && <p className="mt-1 text-xl text-splash" style={{fontFamily: 'var(--font-hand)'}}>Pangkat baru: "{newTitle}"</p>}
        <p className="mt-6 bg-splash/10 border border-splash/20 p-4 rounded-lg text-text-body"> Sebagai hadiah, lo dapet tambahan <strong className="text-xl text-splash">{levelUpInfo.tokenReward} Token</strong> gratis! </p>
        <div className="mt-8"> <Button onClick={handleClose} variant="splash"> Mantap, Lanjut Berkarya! </Button> </div>
      </div>
    </div>
  );
};

export default LevelUpModal;