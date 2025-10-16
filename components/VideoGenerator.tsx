// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo, getVideosOperation } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';

const VIDEO_GEN_COST = 5;
const XP_REWARD = 100;

interface VideoGeneratorProps {
    selectedProjectContext: Project | null;
    ownerPhotoCutout: string | null;
}

type AspectRatio = "1:1" | "9:16" | "16:9" | "4:3" | "3:4";
type LoadingState = 'idle' | 'starting' | 'polling' | 'done' | 'error';

const LOADING_MESSAGES = [
    "Memvalidasi prompt...",
    "Mengirim permintaan ke Mang AI...",
    "Memanaskan mesin video...",
    "AI mulai merender frame pertama...",
    "Ini bisa makan waktu beberapa menit, sabar ya!",
    "Lagi nyusun adegan...",
    "Hampir selesai, lagi nambahin efek...",
    "Mengecek status rendering...",
    "Video sedang dalam perjalanan...",
];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ selectedProjectContext, ownerPhotoCutout }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [useOwnerPhoto, setUseOwnerPhoto] = useState(false);
    
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (ownerPhotoCutout && useOwnerPhoto) {
            setSourceImage(ownerPhotoCutout);
        } else if (!useOwnerPhoto && sourceImage === ownerPhotoCutout) {
            setSourceImage(null);
        }
    }, [ownerPhotoCutout, useOwnerPhoto, sourceImage]);
    
    useEffect(() => {
        let interval: number;
        if (loadingState === 'polling') {
            interval = window.setInterval(() => {
                setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loadingState]);

    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Prompt tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < VIDEO_GEN_COST) { setShowOutOfCreditsModal(true); return; }

        setLoadingState('starting'); setError(null); setVideoUrl(null); playSound('start');
        setLoadingMessage("Mengirim permintaan ke Mang AI...");

        try {
            if (!(await deductCredits(VIDEO_GEN_COST))) throw new Error("Gagal mengurangi token.");

            let finalPrompt = prompt;
            if (selectedProjectContext?.project_data.selectedPersona) {
                const persona = selectedProjectContext.project_data.selectedPersona;
                finalPrompt += `. Gaya visual: ${persona.kata_kunci.join(', ')}. Gunakan palet warna: ${persona.palet_warna_hex.join(', ')}.`;
            }

            let operation = await generateVideo(finalPrompt, sourceImage);
            setLoadingState('polling');
            setLoadingMessage("AI sedang merender video... (ini bisa butuh beberapa menit)");

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
                setLoadingMessage("Masih dalam proses, mengecek status...");
                operation = await getVideosOperation(operation);
            }
            
            if (operation.error) {
                throw new Error(operation.error.message);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error("Tidak ada video yang dihasilkan.");
            
            setLoadingMessage("Mengunduh video...");
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY || ''}`);
            if (!response.ok) throw new Error("Gagal mengunduh video dari server.");

            const videoBlob = await response.blob();
            const localVideoUrl = URL.createObjectURL(videoBlob);
            setVideoUrl(localVideoUrl);

            setLoadingState('done');
            await addXp(XP_REWARD);
            playSound('success');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat video.');
            setLoadingState('error');
            playSound('error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSourceImage(event.target?.result as string);
                setUseOwnerPhoto(false);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Video Generator</h3>
            <p className="text-sm text-text-body">Buat video pendek dari teks atau gambar. Jelaskan adegan yang kamu inginkan, pilih format, dan biarkan AI yang bekerja.</p>

            <div className="space-y-4 p-4 bg-background rounded-lg border border-border-main">
                <Textarea label="Deskripsi Video (Prompt)" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: seekor kucing oren mengendarai skateboard di jalanan kota Tokyo di malam hari, gaya sinematik" rows={4} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Gambar Referensi (Opsional)</label>
                        <div className="flex flex-col gap-2">
                            {ownerPhotoCutout && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={useOwnerPhoto} onChange={e => setUseOwnerPhoto(e.target.checked)} className="rounded bg-surface border-border-main text-primary focus:ring-primary" />
                                    Gunakan Foto Persona Juragan
                                </label>
                            )}
                             <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        </div>
                    </div>
                    {sourceImage && (
                        <div className="text-center">
                            <p className="text-sm font-medium text-text-muted mb-2">Pratinjau Gambar</p>
                            <img src={sourceImage} alt="Preview" className="max-h-24 mx-auto rounded-md" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Aspek Rasio</label>
                    <div className="flex flex-wrap gap-2">
                        {(["16:9", "9:16", "1:1", "4:3", "3:4"] as AspectRatio[]).map(ar => (
                            <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-3 py-1.5 text-sm rounded-md ${aspectRatio === ar ? 'bg-primary text-white font-semibold' : 'bg-surface hover:bg-border-light'}`}>{ar}</button>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={handleGenerate} isLoading={loadingState === 'starting' || loadingState === 'polling'} disabled={!prompt.trim() || loadingState === 'starting' || loadingState === 'polling'} variant="accent" className="w-full">
                Generate Video! ({VIDEO_GEN_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}

            {(loadingState === 'starting' || loadingState === 'polling') && (
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border-main film-strip-background">
                    <LoadingMessage />
                    <p className="text-sm text-text-muted mt-2 text-center">{loadingMessage}</p>
                </div>
            )}
            
            {videoUrl && loadingState === 'done' && (
                 <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Video Hasil Generate</h4>
                        <video src={videoUrl} controls autoPlay loop className="w-full rounded-md" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;