// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAIPet } from '../contexts/AIPetContext';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import AIPetVisual from './AIPetVisual';
import type { AIPetState } from '../types';

const ACTIVATION_COST = 5;

interface AIPetActivationProps {
    onClose: () => void;
}

const statusMessages = [
    "Menghubungi Lab Mang AI...",
    "Mensintesis matriks kepribadian...",
    "Memilih blueprint dasar dari database...",
    "Meracik palet warna dinamis...",
    "Mengkalibrasi statistik dasar...",
    "Menulis bio & cerita asal...",
    "Finalisasi... Inisiasi protokol aktivasi!",
];

const AIPetActivation: React.FC<AIPetActivationProps> = ({ onClose }) => {
    const { activatePet } = useAIPet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Siap aktivasi?");

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % statusMessages.length;
                setStatusText(statusMessages[messageIndex]);
                setProgress(p => Math.min(95, p + 14));
            }, 800);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleActivate = async () => {
        setIsLoading(true);
        setError(null);
        playSound('start');
        
        setProgress(10);
        setStatusText(statusMessages[0]);
        
        try {
            await activatePet();
            setProgress(100);
            setStatusText("Aktivasi Berhasil! AIPet telah lahir!");
            playSound('success');
            setTimeout(onClose, 1000); // Close modal on success after a short delay
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengaktifkan pet.");
            playSound('error');
            setIsLoading(false);
            setProgress(0);
        }
    };

    const podAnimation = `
        @keyframes pod-wobble { 0% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } 100% { transform: rotate(0deg); } }
        .animate-pod-wobble { animation: pod-wobble 0.3s linear infinite; }
    `;

    const dummyPodState: AIPetState = {
        name: 'AIPod',
        stage: 'aipod',
        tier: 'common',
        stats: { energy: 100, creativity: 50, intelligence: 50, charisma: 50 },
        lastFed: Date.now(),
        lastPlayed: Date.now(),
        personality: { minimalist: 5, rustic: 5, playful: 5, modern: 5, luxury: 5, feminine: 5, bold: 5, creative: 5 },
        narrative: null,
        blueprint: null,
        colors: null,
        battleStats: null,
        buffs: [],
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={isLoading ? undefined : onClose}>
            <style>{podAnimation}</style>
            <div className="relative max-w-sm w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                
                <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Aktifkan AIPod?</h2>

                <div className={`w-40 h-48 my-4 ${isLoading ? 'animate-pod-wobble' : ''}`}>
                    <AIPetVisual petState={dummyPodState} />
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
                        <p className="text-text-body mb-6 text-sm">Mengaktifkan AIPod ini akan mereplikasi wujud fisik, statistik, dan narasi unik perdana AIPet-mu. Proses ini membutuhkan <strong className="text-text-header">{ACTIVATION_COST} token</strong>.</p>
                        <div className="flex flex-col items-center gap-3">
                            <Button onClick={handleActivate} isLoading={isLoading} disabled={isLoading}>Ya, Aktifkan Sekarang! ({ACTIVATION_COST} Token)</Button>
                            <Button onClick={onClose} variant="secondary" size="small">Nanti Aja Deh</Button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIPetActivation;