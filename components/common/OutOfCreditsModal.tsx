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
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
          <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-28 mb-4 filter grayscale" style={{ imageRendering: 'pixelated' }} />
          <h2 id="credits-modal-title" className="text-2xl font-bold text-accent mb-2">Waduh, Amunisi Mang AI Abis!</h2>
          <p className="text-text-body mb-6"> Token lo udah abis, Juragan. Tenang, besok kalo token lo masih di bawah 5, Mang AI bakal <strong className="text-text-header">isiin lagi sampe jadi 5</strong>. Sampai ketemu besok, ya! </p>
          <div className="flex flex-col gap-4 items-center w-full">
              <Button onClick={handleClose} variant="accent"> Oke, Mang, Besok Lagi </Button>
              <div className="w-full text-center p-3 bg-background rounded-lg">
                   <p className="text-xs text-text-muted mb-2">Butuh token tanpa batas & gak mau nunggu?</p>
                   <Button variant="secondary" size="small" disabled={true} title="Segera Hadir!" className="!border-accent/50 !text-accent hover:!bg-accent/10 disabled:opacity-60 disabled:cursor-not-allowed"> Upgrade ke Paket Pro (Segera Hadir) </Button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default OutOfCreditsModal;