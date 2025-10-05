// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef, useState } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${active ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-header'}`}
    >
        {children}
    </button>
);

const AboutModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'features' | 'storage' | 'roadmap'>('about');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    else { setActiveTab('about'); } // Reset tab on close
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleClose = async () => { await unlockAudio(); playSound('click'); onClose(); };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) handleClose(); }

  const renderContent = () => {
    switch (activeTab) {
        case 'features':
            return (
                <div className="space-y-3 animate-content-fade-in">
                    <h3 className="font-bold text-primary text-lg" style={{fontFamily: 'var(--font-display)'}}>Fitur Andalan Mang AI:</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong className="text-text-header">Studio Branding Lengkap:</strong> Alur kerja terpandu untuk meracik persona, logo, kit sosmed, kalender konten, hingga desain kemasan.</li>
                        <li><strong className="text-text-header">WarKop Juragan:</strong> Forum komunitas untuk pamer karya, minta masukan, dan ngobrol santai bareng sesama pejuang UMKM.</li>
                        <li><strong className="text-text-header">Pusat Juragan & Gamifikasi:</strong> Naikkan level, selesaikan misi, kumpulkan lencana, dan rebut posisi puncak di papan peringkat.</li>
                        <li><strong className="text-text-header">Generator Ide & Sotoshop:</strong> Butuh inspirasi cepat? Gunakan generator nama/slogan instan atau poles gambarmu di editor Sotoshop.</li>
                        <li><strong className="text-text-header">Asisten Digital AIPet:</strong> Teman digital yang hidup, bergerak, dan bereaksi terhadap progresmu.</li>
                    </ul>
                </div>
            );
        case 'storage':
            return (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 animate-content-fade-in">
                    <h4 className="font-bold text-red-200 text-base mb-2">KEBIJAKAN PENYIMPANAN (WAJIB BACA!)</h4>
                    <p>Untuk menjaga layanan ini tetap gratis, <strong className="text-white">semua aset visual (logo, gambar, mockup) HANYA disimpan sementara di browser Anda.</strong></p>
                    <p className="mt-2">Data teks (seperti persona dan caption) disimpan permanen di akunmu. Tapi, file gambar akan <strong className="text-white">HILANG</strong> jika kamu membersihkan cache browser atau berganti perangkat.</p>
                    <p className="mt-2 font-semibold text-red-200">SOLUSI: Setelah project selesai, buka Brand Hub dan gunakan tombol <strong className="text-white bg-red-500/80 px-1 rounded">'Unduh Semua Aset (.zip)'</strong> untuk mengamankan semua karyamu di komputermu.</p>
                </div>
            );
        case 'roadmap':
            return (
                 <div className="space-y-3 animate-content-fade-in">
                     <h3 className="font-bold text-primary text-lg" style={{fontFamily: 'var(--font-display)'}}>Rencana ke Depan:</h3>
                     <p>Mang AI punya banyak mimpi, termasuk fitur Pro dengan penyimpanan cloud permanen, kolaborasi tim, dan akses ke model AI yang lebih canggih. Ditunggu ya!</p>
                </div>
            );
        case 'about':
        default:
            return (
                <p className="animate-content-fade-in">
                    <strong className="text-text-header">desain.fun</strong> adalah studio branding AI yang lahir dari sebuah mimpi: ngebantu para pejuang UMKM di Indonesia biar <strong className="text-splash">gacor dan naik kelas</strong>. Ini bukan cuma aplikasi, tapi partner setia lo!
                </p>
            );
    }
  }

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
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <header className="p-6 text-center relative">
             <button onClick={handleClose} title="Tutup" className="absolute top-3 right-3 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors close-button-glow z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI character" className="w-24 mx-auto mb-4 animate-breathing-ai" style={{ imageRendering: 'pixelated' }} />
            <h2 id="about-modal-title" className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>Tentang desain.fun</h2>
        </header>

        <nav className="border-b border-t border-border-main flex justify-center flex-wrap">
            <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')}>Tentang</TabButton>
            <TabButton active={activeTab === 'features'} onClick={() => setActiveTab('features')}>Fitur</TabButton>
            <TabButton active={activeTab === 'storage'} onClick={() => setActiveTab('storage')}>Penyimpanan</TabButton>
            <TabButton active={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')}>Rencana</TabButton>
        </nav>
        
        <main className="p-6 overflow-y-auto text-text-body text-sm">
            {renderContent()}
        </main>

        <footer className="p-4 border-t border-border-main flex justify-center">
            <Button onClick={handleClose}> Siap, Mang! Gas Lanjut! </Button>
        </footer>
      </div>
    </div>
  );
};

export default AboutModal;