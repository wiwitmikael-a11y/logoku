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
        <h2 id="tip-modal-title" className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>Eh, Juragan, Tau Gak Sih?</h2>
        <div className="text-text-body text-left space-y-3 mb-8">
            <p>
                Di pasar yang ramenya kayak stasiun pas jam pulang kerja, <strong className="text-splash">branding yang KONSISTEN</strong> itu tiket VVIP biar bisnis lo dilirik dan diinget terus!
            </p>
            <p>
                Ini bukan cuma soal logo cakep, tapi soal <strong className="text-text-header">'rasa' dan 'cerita'</strong> yang bikin pelanggan ngerasa nyambung. Dari warna, gaya bahasa, sampe cara lo bales chat—semua harus seirama.
            </p>
            <p>
                <strong className="block mt-2 text-splash">Kabar baiknya?</strong> Project branding pertamamu di sini lebih hemat! Setiap token yang kepake di alur kerja utama bakal Mang AI <strong className="text-white">balikin lagi 1 token</strong>. Jadi, jangan takut buat eksplorasi. Siap bikin brand lo jadi juara? Ayo kita mulai!
            </p>
        </div>
        <Button onClick={handleConfirm}> Ngerti, Mang! Lanjut! </Button>
      </div>
    </div>
  );
};

export default BrandingTipModal;