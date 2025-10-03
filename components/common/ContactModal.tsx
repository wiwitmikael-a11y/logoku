// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ContactModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }
  const handleLinkClick = async () => { await unlockAudio(); playSound('click'); };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-sm w-full bg-surface rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
        <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-2 text-text-muted rounded-full hover:bg-background hover:text-text-header transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 mb-4 animate-breathing-ai" style={{ imageRendering: 'pixelated' }} />
        <h2 id="contact-modal-title" className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Sokin, Kenalan!</h2>
        <p className="text-text-body mb-6">Aplikasi ini diracik sepenuh hati sama juragan <span className="font-semibold text-text-header" style={{fontFamily: 'var(--font-hand)'}}>@rangga.p.h</span>, ditemenin kopi item sama Mang AI, tentunya.</p>
        <div className="flex flex-col gap-3 w-full">
            <a href="mailto:ragestr4k@gmail.com" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className="w-full flex items-center justify-center gap-3 bg-background hover:bg-border-light text-text-body font-semibold py-3 px-4 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                Kirim Surat Cinta (Email)
            </a>
            <a href="https://www.instagram.com/rangga.p.h" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className="w-full flex items-center justify-center gap-3 bg-background hover:bg-border-light text-text-body font-semibold py-3 px-4 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" role="img"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
                Stalking di Instagram
            </a>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;