// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { generateVideo, getVideosOperation } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const VIDEO_GENERATION_COST = 25;
const XP_REWARD = 100;

const loadingMessages = [
    "Mang AI sedang syuting...",
    "Mempersiapkan set film...",
    "Merender adegan demi adegan...",
    "Menambahkan efek visual...",
    "Proses ini butuh beberapa menit, sabar ya!",
    "Hampir selesai, tinggal polesan akhir...",
];

const VideoGenerator: React.FC = () => {
    const { deductCredits, addXp } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsKeySelected(true);
            }
        };
        checkKey();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume selection is successful to avoid race condition
            setIsKeySelected(true);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageBase64(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const pollOperation = useCallback(async (ai: GoogleGenAI, operation: any): Promise<string> => {
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            try {
                operation = await getVideosOperation(ai, operation);
            } catch (e) {
                if (e instanceof Error && e.message.includes("Requested entity was not found.")) {
                    setIsKeySelected(false); // Reset key state on this specific error
                    throw new Error("Kunci API sepertinya tidak valid. Silakan pilih kunci lain dan coba lagi.");
                }
                throw e; // Re-throw other errors
            }
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Operasi selesai tetapi tidak ada video yang dihasilkan.");
        }
        const response = await fetch(`${downloadLink}&key=${import.meta.env.VITE_API_KEY}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Prompt tidak boleh kosong!');
            return;
        }
        if (!(await deductCredits(VIDEO_GENERATION_COST))) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);
        playSound('start');

        try {
            // Create a new instance right before the call to ensure the latest key is used
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            let operation = await generateVideo(ai, prompt, imageBase64 ?? undefined);
            const url = await pollOperation(ai, operation);
            
            setVideoUrl(url);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat video.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isKeySelected) {
        return (
            <div className="text-center p-6 bg-background rounded-lg border border-border-main">
                <h4 className="text-lg font-bold text-text-header">Akses Fitur Video (Veo)</h4>
                <p className="text-sm text-text-muted my-3">Untuk menggunakan fitur pembuatan video, Anda perlu memilih Kunci API Anda sendiri. Penggunaan model Veo akan dikenakan biaya pada akun Google Cloud Anda.</p>
                <Button onClick={handleSelectKey} variant="accent">Pilih Kunci API</Button>
                <p className="text-xs text-text-muted mt-3">
                    Pelajari lebih lanjut tentang <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">penagihan Gemini API</a>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Video AI (Veo)</h3>
            <p className="text-sm text-text-body">Ubah imajinasimu menjadi video pendek. Tuliskan adegan yang kamu inginkan, dan Mang AI akan jadi sutradaranya. Kamu juga bisa menambahkan gambar awal sebagai referensi.</p>

            <Textarea
                label="Deskripsi Adegan Video"
                name="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Contoh: seekor kucing astronot melayang di angkasa dengan latar belakang galaksi nebula, gaya sinematik"
                rows={4}
                disabled={isLoading}
            />

            <div className="p-4 bg-background rounded-lg border border-border-main">
                <label htmlFor="image-upload" className="text-sm font-medium text-text-muted">Gambar Awal (Opsional)</label>
                <div className="mt-2 flex items-center gap-4">
                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-text-body file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isLoading} />
                    {imageBase64 && <img src={imageBase64} alt="Preview" className="w-16 h-16 object-cover rounded-md" />}
                </div>
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="splash" className="w-full">
                Buat Video! ({VIDEO_GENERATION_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}

            {isLoading && (
                <div className="text-center p-6 bg-background rounded-lg border border-border-main film-strip-background">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI working..." className="w-20 h-20 mx-auto mb-4 animate-breathing-ai" />
                    <p className="font-semibold text-text-header animate-pulse">{loadingMessage}</p>
                    <p className="text-xs text-text-muted mt-2">Pembuatan video bisa memakan waktu 2-5 menit.</p>
                </div>
            )}

            {videoUrl && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <h4 className="font-bold text-text-header">Hasil Video:</h4>
                    <div className="bg-black rounded-lg overflow-hidden">
                        <video src={videoUrl} controls autoPlay loop className="w-full aspect-video" />
                    </div>
                    <a href={videoUrl} download={`desainfun_video_${Date.now()}.mp4`} className="inline-block">
                        <Button variant="secondary">Unduh Video</Button>
                    </a>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;
