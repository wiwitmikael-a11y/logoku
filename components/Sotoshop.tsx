// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Button from './common/Button';

interface SotoshopProps {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const Sotoshop: React.FC<SotoshopProps> = ({ show, onClose }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-content-fade-in" onClick={onClose}>
            <div 
                className="relative max-w-lg w-full bg-surface border border-border-main rounded-2xl shadow-xl p-8 flex flex-col items-center text-center"
                onClick={e => e.stopPropagation()}
            >
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 mb-4" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-3xl font-bold text-primary mb-2" style={{fontFamily: 'var(--font-display)'}}>Sotoshop Under Construction</h2>
                <p className="text-text-body mb-6">
                    Waduh, Mang AI lagi beres-beres di sini! Fitur Sotoshop lagi disempurnain biar makin canggih. Ditunggu ya, Juragan!
                </p>
                <Button onClick={onClose} variant="secondary">
                    Oke, Siap!
                </Button>
            </div>
        </div>
    );
};

export default Sotoshop;