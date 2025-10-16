// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { playSound } from '../../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface PuzzleCaptchaModalProps {
  show: boolean;
  onSuccess: () => void;
}

const PuzzleCaptchaModal: React.FC<PuzzleCaptchaModalProps> = ({ show, onSuccess }) => {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isVerified) {
      playSound('success');
      const timer = setTimeout(onSuccess, 500);
      return () => clearTimeout(timer);
    }
  }, [isVerified, onSuccess]);

  if (!show) return null;

  // This is a dummy captcha for UX purposes.
  // A real implementation would involve a proper library.
  const handleVerify = () => {
    setIsVerified(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI"
          className="w-20 h-20 mx-auto mb-4"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 className="text-xl font-bold text-text-header mb-2">Verifikasi Dulu, Juragan!</h2>
        <p className="text-sm text-text-muted mb-4">Untuk memastikan Anda bukan robot, silakan selesaikan puzzle ini.</p>
        <div className="p-4 border border-dashed border-border-main rounded-lg">
          <p className="text-text-muted mb-4">"Geser untuk mencocokkan potongan puzzle"</p>
          {isVerified ? (
            <div className="bg-green-500/20 text-green-400 p-3 rounded-md">
              ✓ Terverifikasi!
            </div>
          ) : (
            <button
              onClick={handleVerify}
              className="w-full p-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Klik di Sini untuk Verifikasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleCaptchaModal;
