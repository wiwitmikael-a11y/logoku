// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Button from './Button';

const OutOfCreditsModal: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold text-accent mb-2">Waduh, Token Habis!</h2>
                <p className="text-text-body mb-4">Token gratis Anda untuk hari ini sudah habis. Token akan di-reset kembali besok.</p>
                 <p className="text-xs text-text-muted mb-6">Untuk saat ini, fitur top-up belum tersedia. Terima kasih atas pengertiannya!</p>
                <Button onClick={onClose}>OK, Saya Mengerti</Button>
            </div>
        </div>
    );
};

export default OutOfCreditsModal;
