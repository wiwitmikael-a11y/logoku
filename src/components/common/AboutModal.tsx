// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AboutModal: React.FC<Props> = ({ show, onClose }) => {
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
      aria-labelledby="about-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col max-h-[90vh]">
        <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="overflow-y-auto pr-4 -mr-4">
            <div className="text-center mb-6">
                 <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mx-auto mb-4" style={{imageRendering: 'pixelated'}}/>
                <h2 id="about-modal-title" className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tentang desain.fun</h2>
                <p className="text-lg text-text-muted" style={{fontFamily: 'var(--font-hand)'}}>Studio Branding AI untuk UMKM Juara</p>
            </div>
            <div className="text-sm text-text-body space-y-4 text-justify">
                <p><strong>desain.fun</strong> adalah sebuah platform eksperimental yang dirancang untuk memberdayakan para pelaku UMKM di Indonesia. Visinya sederhana: membuat branding berkualitas tinggi jadi lebih mudah, cepat, dan terjangkau bagi semua orang, berbekal kekuatan AI generatif.</p>
                <p>Saya percaya bahwa brand yang kuat adalah kunci sukses di era digital. Namun, banyak UMKM yang terkendala biaya, waktu, dan akses ke talenta desain profesional. Di sinilah <strong className="text-text-header">Mang AI</strong>, asisten virtual kita, hadir untuk membantu. Dari menciptakan persona brand yang solid, mendesain logo yang ikonik, hingga merencanakan konten media sosial yang engage, semua bisa dilakukan di sini.</p>
                <p>Aplikasi ini dibangun dengan semangat gotong royong dan eksplorasi. Fitur-fitur yang ada akan terus berkembang berdasarkan masukan dari para "Juragan" (sebutan untuk pengguna setia kita). Tujuannya bukan untuk menggantikan desainer grafis, melainkan sebagai alat bantu awal (starting point) untuk memvisualisasikan ide dan membangun fondasi brand yang kokoh.</p>
                 <div className="mt-6 p-4 bg-background rounded-lg border border-border-main">
                    <h4 className="font-semibold text-text-header mb-2">Teknologi di Balik Layar</h4>
                    <ul className="list-disc list-inside text-xs space-y-1">
                        <li><strong>AI Engine:</strong> Google Gemini API</li>
                        <li><strong>Framework:</strong> React (Vite) + TypeScript</li>
                        <li><strong>Styling:</strong> TailwindCSS</li>
                        <li><strong>Backend & Auth:</strong> Supabase</li>
                        <li><strong>Hosting:</strong> Vercel</li>
                    </ul>
                </div>
                <p className="text-center text-xs text-text-muted mt-6">Dibuat dengan ❤️ oleh Rangga P. H. untuk kemajuan UMKM Indonesia.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
