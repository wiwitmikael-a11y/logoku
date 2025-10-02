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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character"
          className="w-24 mb-4 animate-breathing-ai"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="about-modal-title" className="text-2xl font-bold text-indigo-400 mb-4 text-center">Tentang logo.ku (Versi Awal)</h2>
        <div className="text-gray-300 text-sm text-left space-y-3 mb-8">
            <p>
                <strong className="text-white">logo.ku</strong> adalah studio branding AI yang lahir dari sebuah mimpi: ngebantu para pejuang UMKM di Indonesia biar <strong className="text-yellow-400">gacor dan naik kelas</strong>.
            </p>
            <p>
                Aplikasi ini masih anget-angetnya, Juragan! Ibaratnya, ini <strong className="text-white">versi 0.1</strong>. Mang AI masih semangat-semangatnya belajar dan nambah fitur.
            </p>
             <p className="p-3 bg-red-900/40 border border-red-700/50 rounded-lg">
                <strong className="text-red-300">PENTING BANGET:</strong> Aplikasi ini menyimpan data teks project lo, tapi <strong className="text-white">TIDAK MENYIMPAN FILE GAMBAR DI CLOUD.</strong> Jadi, Mang AI saranin banget, <strong className="text-white">setiap aset (logo, gambar, dll) yang udah lo generate, langsung diunduh ya!</strong> Developer nggak nanggung kalo ada data yang ilang. Oke, Juragan?
            </p>
            <div className="pt-3 border-t border-gray-700 space-y-3">
                 <h3 className="font-bold text-indigo-300">Keuntungan Lo Jadi Tim Awal:</h3>
                 <ul className="list-disc list-inside space-y-1">
                     <li>Lo bisa nikmatin semua fitur ini <strong className="text-white">GRATIS</strong> dan kasih masukan langsung ke developer buat ngebentuk masa depan aplikasi ini.</li>
                     <li>Lo jadi bagian dari sejarah perjalanan Mang AI dari awal!</li>
                 </ul>
                 <h3 className="font-bold text-indigo-300">Rencana ke Depan:</h3>
                 <p>Mang AI punya banyak mimpi, termasuk fitur Pro dengan penyimpanan cloud, kolaborasi tim, dan akses ke model AI yang lebih canggih. Ditunggu ya!</p>
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