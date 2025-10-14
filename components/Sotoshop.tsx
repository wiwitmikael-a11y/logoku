// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
}

const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 p-4 flex flex-col items-center justify-center">
      <div className="bg-surface rounded-lg shadow-2xl p-8 text-center border border-border-main">
        <h2 className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>Sotoshop Dalam Perbaikan</h2>
        <p className="text-text-body max-w-md mx-auto mb-6">
          Waduh, Juragan! Kayaknya Mang AI lagi beres-beres di ruang editor. Fitur Sotoshop lagi dalam perbaikan dan akan segera kembali dengan lebih canggih!
        </p>
        <button
          onClick={onClose}
          className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-hover transition-colors"
        >
          Oke, Paham!
        </button>
      </div>
    </div>
  );
};

export default Sotoshop;
