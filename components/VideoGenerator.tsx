// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import * as geminiService from '../services/geminiService';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const VIDEO_GENERATION_COST = 5;
const XP_REWARD = 50;

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LOADING_MESSAGES = [
    "Sabar, Mang AI lagi ngerakit kamera...",
    "Mencari lokasi syuting yang pas...",
    "Lagi casting pemeran utama...",
    "Rendering frame 1 dari 120...",
    "Menambahkan efek sinematik...",
    "Proses color grading...",
    "Menyusun adegan demi adegan...",
    "Lagi bikin kopi buat kru film...",
    "Finalisasi, nambahin scoring musik...",
    "Dikit lagi kelar, jangan tinggalin ya!",
];

const VideoGenerator: React.FC = () => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const credits = profile?.credits ?? 0;

    const [prompt, setPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('File yang diupload harus berupa gambar.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setImageBase64(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Prompt tidak boleh kosong!');
            return;
        }
        if (credits < VIDEO_GENERATION_COST) {
            setShowOutOfCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(LOADING_MESSAGES[0]);
        playSound('start');

        try {
            if (!(await deductCredits(VIDEO_GENERATION_COST))) {
                throw new Error("Gagal mengurangi token.");
            }
            const resultUrl = await geminiService.generateVideo(prompt, imageBase64);
            setVideoUrl(resultUrl);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat video.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-content-fade-in">
            <p className="text-splash font-bold text-sm">VIDEO GENERATOR:</p>
            <p className="text-white text-sm">Ubah idemu jadi video pendek sinematik! Cukup tuliskan prompt, atau tambahkan gambar sebagai referensi visual. Proses ini butuh waktu beberapa menit, jadi mohon bersabar ya, Juragan.</p>
            <p className="text-xs text-text-muted">Biaya: {VIDEO_GENERATION_COST} Token | Hadiah: +{XP_REWARD} XP. <strong className="text-yellow-400">Catatan: Video yang dihasilkan akan memiliki watermark dari Google.</strong></p>

            {!isLoading && !videoUrl && (
                <div className="space-y-4 pt-2">
                    <Textarea 
                        label="Deskripsikan video yang kamu mau (Prompt):"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Contoh: seekor kucing oren mengendarai sepeda motor dengan kecepatan tinggi di jalanan neon Tokyo"
                        rows={3}
                    />
                    <div 
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                        className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border-main'}`}
                    >
                        {imageBase64 ? (
                            <div className="relative">
                                <img src={imageBase64} alt="Preview" className="max-h-32 rounded-md" />
                                <button onClick={() => setImageBase64(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 font-bold">&times;</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-text-muted text-sm">Seret & lepas gambar di sini (opsional)</p>
                                <p className="text-xs text-text-muted my-1">atau</p>
                                <label htmlFor="video-image-upload" className="text-primary hover:underline cursor-pointer font-semibold">Pilih File</label>
                                <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                            </>
                        )}
                    </div>
                    <Button onClick={handleGenerate} disabled={!prompt || isLoading} variant="splash" className="w-full">
                        Generate Video ({VIDEO_GENERATION_COST} Token)
                    </Button>
                </div>
            )}
            
            {error && <ErrorMessage message={error} />}

            {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-black/30 rounded-lg border border-splash/20 min-h-[300px] film-strip-background">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mb-4 animate-breathing-ai" style={{ imageRendering: 'pixelated' }} />
                    <h3 className="text-2xl font-bold text-splash" style={{ fontFamily: 'var(--font-display)' }}>Mang AI Lagi Syuting...</h3>
                    <p className="text-text-body mt-2">Proses bikin video butuh waktu beberapa menit. Jangan tutup halaman ini ya, Juragan!</p>
                    <p className="font-semibold text-yellow-400 mt-4 h-5 animate-pulse">{loadingMessage}</p>
                </div>
            )}

            {videoUrl && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-green-400">Video Berhasil Dibuat!</h3>
                    <video src={videoUrl} controls className="w-full rounded-lg border border-border-main" />
                    <div className="flex gap-4">
                        <a href={videoUrl} download={`${prompt.substring(0, 20).replace(/\s/g, '_')}.mp4`} className="w-full">
                            <Button variant="secondary" className="w-full">Unduh Video</Button>
                        </a>
                        <Button onClick={() => { setVideoUrl(null); setPrompt(''); setImageBase64(null); }} className="w-full">Bikin Video Lain</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;
