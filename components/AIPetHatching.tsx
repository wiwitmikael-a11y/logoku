// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAIPet } from '../contexts/AIPetContext';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import AIPetVisual from './AIPetVisual';
import type { AIPetState } from '../types';

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
        @keyframes egg-crack { 0% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } 100% { transform: rotate(0deg); } }
        .animate-egg-crack { animation: egg-crack 0.2s linear infinite; }
    `;

    const dummyEggState: AIPetState = {
        name: 'Telur AI',
        stage: 'egg',
        stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
        lastFed: Date.now(),
        lastPlayed: Date.now(),
        personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
        atlas_url: null,
        manifest: null,
        narrative: null,
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={isLoading ? undefined : onClose}>
            <style>{eggAnimation}</style>
            <div className="relative max-w-sm w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                
                <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tetaskan AI Pet?</h2>

                <div className={`w-48 h-48 my-4 ${isLoading ? 'animate-egg-crack' : ''}`}>
                    <AIPetVisual petState={dummyEggState} />
                </div>
                
                {isLoading ? (
                    <div className="w-full">
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