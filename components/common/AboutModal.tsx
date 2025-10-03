// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AboutModal: React.FC<Props> = ({ show, onClose }) => {
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-2 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character"
          className="w-24 mb-4 animate-breathing-ai"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="about-modal-title" className="text-2xl font-bold text-sky-600 mb-4 text-center">Tentang desain.fun</h2>
        <div className="text-slate-600 text-sm text-left space-y-4 mb-8">
            <p>
                <strong className="text-slate-800">desain.fun</strong> adalah studio branding AI yang lahir dari sebuah mimpi: ngebantu para pejuang UMKM di Indonesia biar <strong className="text-orange-500">gacor dan naik kelas</strong>. Ini bukan cuma aplikasi, tapi partner setia lo!
            </p>
            
            <div className="pt-3 border-t border-slate-200 space-y-3">
                 <h3 className="font-bold text-sky-600">Fitur Andalan Mang AI:</h3>
                 <ul className="list-disc list-inside space-y-2">
                     <li><strong className="text-slate-800">Studio Branding Lengkap:</strong> Dari persona, logo, social media kit, kalender konten, sampe desain kemasan, semua diracik Mang AI.</li>
                     <li><strong className="text-slate-800">Arena Kreativitas 'Pameran Brand':</strong> Pamerin hasil karyamu, intip karya juragan lain, dan kasih 'Menyala!' 🔥 buat dapet XP.</li>
                     <li><strong className="text-slate-800">Gamifikasi Seru:</strong> Naik level, kumpulin XP, dan dapetin lencana 'Kejuraganan' sambil ngasah skill branding lo.</li>
                     <li><strong className="text-slate-800">Asisten Pribadi Mang AI:</strong> Bingung? Tanya aja langsung ke Mang AI lewat tombol di pojok kanan bawah.</li>
                 </ul>
            </div>

             <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <strong className="text-red-700">PENTING BANGET:</strong> Aplikasi ini menyimpan data teks project lo, tapi <strong className="text-black">TIDAK MENYIMPAN FILE GAMBAR DI CLOUD.</strong> Jadi, Mang AI saranin banget, <strong className="text-black">setiap aset (logo, gambar, dll) yang udah lo generate, langsung diunduh ya!</strong> Developer nggak nanggung kalo ada data yang ilang. Oke, Juragan?
            </p>
            
            <div className="pt-3 border-t border-slate-200 space-y-3">
                 <h3 className="font-bold text-sky-600">Rencana ke Depan:</h3>
                 <p>Mang AI punya banyak mimpi, termasuk fitur Pro dengan penyimpanan cloud permanen, kolaborasi tim, dan akses ke model AI yang lebih canggih. Ditunggu ya!</p>
            </div>
        </div>
        <Button onClick={handleClose}>
            Siap, Mang! Gas Lanjut!
        </Button>
      </div>
    </div>
  );
};

export default AboutModal;