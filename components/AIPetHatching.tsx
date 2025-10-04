// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAIPet } from '../contexts/AIPetContext';
import Button from './common/Button';
import { playSound } from '../services/soundService';

const HATCH_COST = 10;

interface AIPetHatchingProps {
    onClose: () => void;
}

const statusMessages = [
    "Menghubungi Mang AI...",
    "Lagi nyiapin kanvas & cat digital...",
    "Menggambar bentuk kepala & badan...",
    "Menambahkan detail tangan dan kaki...",
    "Mewarnai setiap bagian...",
    "Cetak biru AIPet selesai! Menganalisis gambar...",
    "Menandai titik sendi untuk animasi...",
    "Menulis panduan perakitan...",
    "Sedikit lagi... lagi dirakit!",
];

const AIPetHatching: React.FC<AIPetHatchingProps> = ({ onClose }) => {
    const { hatchPet } = useAIPet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Siap menetaskan?");

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % statusMessages.length;
                setStatusText(statusMessages[messageIndex]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleHatch = async () => {
        setIsLoading(true);
        setError(null);
        playSound('start');
        
        // Simulate progress for better UX
        setProgress(10);
        setStatusText(statusMessages[0]);
        
        // Simulate first stage (Image generation - takes longer)
        setTimeout(() => {
            setProgress(50);
            setStatusText(statusMessages[2]);
        }, 3000);
        
        // Simulate second stage (Manifest generation)
        setTimeout(() => {
            setProgress(75);
            setStatusText(statusMessages[6]);
        }, 12000);


        try {
            await hatchPet();
            setProgress(100);
            setStatusText("Brojol! Selamat datang AIPet baru!");
            playSound('success');
            setTimeout(onClose, 1000); // Close modal on success after a short delay
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menetaskan pet.");
            playSound('error');
            setIsLoading(false);
            setProgress(0);
        }
    };

    const eggAnimation = `
        @keyframes egg-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes egg-crack { 0% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } 100% { transform: rotate(0deg); } }
        .animate-egg-pulse { animation: egg-pulse 2.5s ease-in-out infinite; }
        .animate-egg-crack { animation: egg-crack 0.2s linear infinite; }
    `;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={isLoading ? undefined : onClose}>
            <style>{eggAnimation}</style>
            <div className="relative max-w-sm w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                <div className={`w-48 h-48 mb-4 ${isLoading ? 'animate-egg-crack' : 'animate-egg-pulse'}`}>
                    <svg viewBox="0 0 100 125">
                        <g transform="translate(0, 5)">
                            <path d="M50,5 C25,5 10,40 10,70 C10,100 30,120 50,120 C70,120 90,100 90,70 C90,40 75,5 50,5Z" fill="url(#hatchEggGradient)" stroke="#44403c" strokeWidth="2"/>
                            <defs><radialGradient id="hatchEggGradient" cx="0.5" cy="0.9" r="0.9"><stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#f8fafc" /></radialGradient></defs>
                            <circle cx="50" cy="40" r="8" fill="#c084fc" opacity="0.6" /><circle cx="70" cy="70" r="12" fill="#60a5fa" opacity="0.6" /><circle cx="35" cy="85" r="10" fill="#f87171" opacity="0.6" />
                            {isLoading && <path d="M 40 50 L 55 60 L 50 75 L 65 85" stroke="#44403c" strokeWidth="1.5" fill="none" />}
                        </g>
                    </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tetaskan AI Pet?</h2>

                {isLoading ? (
                    <div className="mt-4 w-full">
                        <p className="text-sm text-splash font-semibold animate-pulse">{statusText}</p>
                        <div className="w-full bg-background rounded-full h-2.5 mt-2 border border-border-main">
                            <div className="bg-splash h-2.5 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-text-body mb-6">Menetaskan telur ini akan memunculkan wujud perdana AI Pet-mu! Proses ini menggunakan AI dan butuh <strong className="text-text-header">{HATCH_COST} token</strong>.</p>
                        <div className="flex flex-col items-center gap-3">
                            <Button onClick={handleHatch} isLoading={isLoading} disabled={isLoading}>Ya, Tetaskan Sekarang! ({HATCH_COST} Token)</Button>
                            <Button onClick={onClose} variant="secondary" size="small">Nanti Aja Deh</Button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIPetHatching;