// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onConfirm: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const BrandingTipModal: React.FC<Props> = ({ show, onConfirm }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onConfirm(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onConfirm]);

  if (!show) return null;

  const handleConfirm = async () => { await unlockAudio(); playSound('click'); onConfirm(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleConfirm(); }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 mb-4" style={{ imageRendering: 'pixelated' }} />
        <h2 id="tip-modal-title" className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>Selamat Datang di Studio!</h2>
        <div className="text-text-body text-center space-y-3 mb-8">
            <p>
                Sebagai juragan baru, Mang AI udah siapin amunisi awal buat lo: <strong className="text-splash text-xl">20 Token GRATIS!</strong>
            </p>
            <p>
                Gunakan token ini buat ngeracik brand pertamamu dari nol—mulai dari persona, logo, sampai konten sosmed. Gak ada alesan buat nunda lagi.
            </p>
            <p className="font-bold text-text-header">
                Ayo kita mulai petualangan branding ini!
            </p>
        </div>
        <Button onClick={handleConfirm}> Gas, Mang! Kita Mulai! </Button>
      </div>
    </div>
  );
};

export default BrandingTipModal;