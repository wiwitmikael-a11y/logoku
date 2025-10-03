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
            <p> Di lautan UMKM Indonesia yang ramenya kayak pasar malem, banyak banget kan yang jualannya mirip-mirip? Nah, di sinilah <strong className="text-splash">branding yang konsisten</strong> jadi jagoannya! </p>
            <p> Branding itu bukan cuma soal logo cakep, tapi soal <strong className="text-text-header">'rasa' dan 'cerita'</strong> yang lo kasih ke pelanggan. Kalo brand lo konsisten—dari warna, gaya bahasa, sampe cara lo ngelayanin—pelanggan jadi gampang inget, percaya, dan akhirnya balik lagi. </p>
            <p> Ini yang bikin "Kopi Senja" lo beda dari ribuan kopi senja lainnya. Siap bikin brand lo jadi juara? <strong className="block mt-2 text-splash">Sebagai pemanasan, project branding pertamamu dari A sampai Z di sini gratis, lho!</strong> Ayo kita mulai! </p>
        </div>
        <Button onClick={handleConfirm}> Ngerti, Mang! Lanjut! </Button>
      </div>
    </div>
  );
};

export default BrandingTipModal;