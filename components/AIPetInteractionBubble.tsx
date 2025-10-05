// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState } from 'react';
import Button from './common/Button';
import { playSound } from '../services/soundService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAsk: () => void;
  onShowLab: () => void;
  petName: string;
}

const phrases = [
    "Ada yang bisa dibantuin, Juragan?",
    "Lagi mikirin ide apa nih?",
    "Hehe, iseng ya? 🤪",
    "Kata Mang AI, istirahat itu penting lho.",
    "Mau curhat soal branding? Sokin!",
    "Pssst... coba cek Lab-ku, ada data baru!",
    "Butuh ide? Atau mau liat statistikku?",
    "Nge-klik aku terus, naksir ya? 😉",
];

const AIPetInteractionBubble: React.FC<Props> = ({ isOpen, onClose, onAsk, onShowLab, petName }) => {
    const [phrase, setPhrase] = useState('');

    useEffect(() => {
        if (isOpen) {
            playSound('select');
            setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAsk = () => {
        onAsk();
        onClose();
    };

    const handleShowLab = () => {
        onShowLab();
        onClose();
    };

    return (
        <div 
            className="absolute bottom-[90px] w-64 bg-surface/90 backdrop-blur-md border border-border-main rounded-xl shadow-lg z-30 p-3 animate-aipet-blip-in" 
            style={{ left: '50%', transform: 'translateX(-50%)' }}
            onClick={(e) => e.stopPropagation()}
        >
             <style>{`
                .interaction-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 8px;
                    border-style: solid;
                    border-color: rgb(var(--c-surface)/0.9) transparent transparent transparent;
                }
            `}</style>
            <div className="interaction-bubble relative">
                <button onClick={onClose} className="absolute -top-1 -right-1 text-text-muted hover:text-text-header text-xl leading-none" title="Tutup">&times;</button>
                <p className="text-sm text-text-body mb-3 pr-4">{phrase}</p>
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleAsk} size="small" variant="secondary">Tanya {petName}</Button>
                    <Button onClick={handleShowLab} size="small" variant="secondary">Lihat Lab</Button>
                </div>
            </div>
        </div>
    );
};

export default AIPetInteractionBubble;