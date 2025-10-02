import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LegalDisclaimerModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  const [isChecked, setIsChecked] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus(); // Focus the modal for screen readers
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-gray-800 border border-indigo-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <img
            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
            alt="Mang AI character"
            className="w-24 mb-4"
            style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="disclaimer-title" className="text-2xl font-bold text-indigo-400 mb-4 text-center">
            Penting! Sebelum Pakai Logo Ini
        </h2>
        <div className="text-gray-300 text-sm space-y-3 mb-6 text-left max-w-md">
            <p>
                Logo ini dibuat oleh Kecerdasan Buatan (AI) dan <strong className="text-white">TIDAK DIJAMIN 100% UNIK</strong>. Ada kemungkinan kecil logo ini mirip dengan desain lain yang sudah ada.
            </p>
            <p>
                <strong className="text-white">ANDA BERTANGGUNG JAWAB PENUH</strong> untuk melakukan pengecekan merek dagang (trademark) di <a href="https://pdki-indonesia.dgip.go.id/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">database resmi pemerintah (PDKI)</a> sebelum menggunakannya untuk tujuan komersial.
            </p>
            <p>
                Kami tidak bertanggung jawab atas segala sengketa hukum yang mungkin timbul di masa depan akibat penggunaan logo ini.
            </p>
        </div>

        <div className="flex items-start space-x-3 bg-gray-900/50 p-4 rounded-lg w-full max-w-md mb-6">
            <input
                type="checkbox"
                id="disclaimer-agree"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                className="h-5 w-5 mt-0.5 flex-shrink-0 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="disclaimer-agree" className="text-sm text-gray-300">
                Saya mengerti dan setuju dengan ketentuan ini, dan akan melakukan pengecekan sendiri sebelum menggunakan logo ini untuk bisnis.
            </label>
        </div>

        <div className="flex gap-4">
            <Button onClick={onClose} variant="secondary">
                Batal
            </Button>
            <Button onClick={handleConfirm} disabled={!isChecked}>
                Setuju & Lanjutkan
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimerModal;