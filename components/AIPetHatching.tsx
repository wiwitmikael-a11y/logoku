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
        @keyframes egg-crack { 0% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } 100% { transform: rotate(0deg); } }
        @keyframes divine-glow {
            0%, 100% {
                filter: drop-shadow(0 0 15px rgb(var(--c-splash) / 0.5)) drop-shadow(0 0 30px rgb(var(--c-splash) / 0.3));
            }
            50% {
                filter: drop-shadow(0 0 25px rgb(var(--c-splash) / 0.8)) drop-shadow(0 0 50px rgb(var(--c-splash) / 0.5));
            }
        }
        .animate-egg-pulse { animation: egg-pulse 2.5s ease-in-out infinite; }
        .animate-egg-crack { animation: egg-crack 0.2s linear infinite; }
        .divine-glow-effect { animation: divine-glow 3.5s ease-in-out infinite; }
    `;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={isLoading ? undefined : onClose}>
            <style>{eggAnimation}</style>
            <div className="relative max-w-sm w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                <div className={`w-40 h-40 mb-4 ${isLoading ? 'animate-egg-crack' : 'animate-egg-pulse divine-glow-effect'}`}>
                     <svg viewBox="0 0 100 125">
                        <defs>
                            <pattern id="mecha-pattern-egg" patternUnits="userSpaceOnUse" width="12" height="12">
                                <path d="M-2,2 l4,-4 M0,12 l12,-12 M10,14 l4,-4" stroke="rgb(var(--c-border))" strokeWidth="0.7" />
                            </pattern>
                             <radialGradient id="eggShine" cx="0.3" cy="0.3" r="0.8">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </radialGradient>
                        </defs>
                        <g transform="translate(0, 5)">
                            {/* Base egg shape - slightly rounder and cuter */}
                            <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="#404040" stroke="#18181b" strokeWidth="3"/>
                            
                            {/* Mecha Panel Texture */}
                            <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="url(#mecha-pattern-egg)" opacity="0.3"/>
                            
                            {/* Bioluminescent "Circuits" */}
                            <path d="M 40 20 Q 50 40 45 60 T 55 90" stroke="rgb(var(--c-splash))" strokeWidth="1.5" fill="none" strokeLinecap="round" filter="url(#glow)"/>
                            <path d="M 60 25 Q 75 50 60 75 T 70 100" stroke="rgb(var(--c-splash))" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#glow)"/>
                            <circle cx="50" cy="70" r="3" fill="rgb(var(--c-splash))" filter="url(#glow)" />

                             {/* Metallic Shine */}
                            <path d="M50,5 C25,5 12,35 12,70 C12,105 30,120 50,120 C70,120 88,105 88,70 C88,35 75,5 50,5Z" fill="url(#eggShine)"/>
                        </g>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
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