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
        <h2 id="about-modal-title" className="text-2xl font-bold text-indigo-400 mb-4 text-center">Tentang logo.ku</h2>
        <div className="text-gray-300 text-sm text-left space-y-3 mb-8">
            <p>
                <strong className="text-white">logo.ku</strong> adalah studio branding AI yang lahir dari sebuah mimpi: membantu para pejuang Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia untuk bisa <strong className="text-yellow-400">naik kelas</strong>.
            </p>
            <p>
                Kami percaya bahwa branding yang kuat bukanlah hak eksklusif perusahaan besar. Dengan ditemani asisten virtual kami, <strong className="text-white">Mang AI</strong>, kami ingin membuat proses branding yang biasanya rumit dan mahal menjadi mudah, cepat, dan terjangkau bagi semua orang.
            </p>
            <p>
                Dari menciptakan logo yang berkarakter, merumuskan persona brand yang kuat, hingga merancang rentetan konten media sosial siap pakai—semuanya bisa dilakukan dalam hitungan menit.
            </p>
             <p className="pt-3 border-t border-gray-700">
                Misi kami adalah memberdayakan setiap UMKM dengan alat yang mereka butuhkan untuk bersinar di dunia digital. Karena kami yakin, di balik setiap produk hebat, ada brand hebat yang menungggu untuk diceritakan.
            </p>
        </div>
        <Button onClick={handleClose}>
            Mantap, Mang!
        </Button>
      </div>
    </div>
  );
};

export default AboutModal;
