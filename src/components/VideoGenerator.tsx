// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateVideo, extendVideo, pollVideoOperation } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, VideoAsset } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import CollapsibleSection from './common/CollapsibleSection';
import Select from './common/Select';
import { VideosOperation } from '@google/genai';
import Tooltip from './common/Tooltip';

const VIDEO_COST = 10; // HARGA PROMO BETA! (Normal 20)
const EXTEND_COST = 10;
const XP_REWARD = 100;

const LOADING_MESSAGES = [
    "Memanggil kru film AI...",
    "Menyiapkan kamera virtual...",
    "Merender adegan demi adegan...",
    "Menambahkan efek visual...",
    "Proses ini bisa makan waktu beberapa menit, sabar ya!",
    "Hampir selesai, sentuhan akhir..."
];

interface Props {
    project: Project;
    onUpdateProject: (data: any) => Promise<void>;
}

const VideoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<VideoAsset | null>(null);

    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    const operationRef = useRef<VideosOperation | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);

    // API Key Check for VEO
    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            } else {
                 setApiKeySelected(true); // Assume key exists if aistudio is not present
            }
            setIsCheckingApiKey(false);
        };
        checkKey();
    }, []);

    const handleSelectApiKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race conditions and let the user proceed.
            // Error handling will catch if the key is invalid.
            setApiKeySelected(true);
        }
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const startPolling = (op: VideosOperation) => {
        stopPolling();
        operationRef.current = op;
        pollingIntervalRef.current = window.setInterval(async () => {
            if (!operationRef.current) {
                stopPolling();
                return;
            }
            try {
                const updatedOp = await pollVideoOperation(operationRef.current);
                operationRef.current = updatedOp;

                if (updatedOp.done) {
                    stopPolling();
                    setIsLoading(false);
                    if (updatedOp.error) {
                        throw new Error(updatedOp.error.message);
                    }
                    const videoUri = updatedOp.response?.generatedVideos?.[0]?.video?.uri;
                    if (videoUri) {
                        const newVideoAsset: VideoAsset = {
                            id: `vid_${Date.now()}`,
                            prompt: prompt,
                            videoUrl: `${videoUri}&key=${import.meta.env.VITE_VERTEX_API_KEY || import.meta.env.VITE_API_KEY}`,
                            apiReference: updatedOp.response?.generatedVideos?.[0]?.video,
                        };
                        setResult(newVideoAsset);
                        await handleSaveToProject(newVideoAsset);
                        await addXp(XP_REWARD);
                        playSound('success');
                    } else {
                        throw new Error("Operasi video selesai tetapi tidak ada URI video yang ditemukan.");
                    }
                }
            } catch (err) {
                stopPolling();
                setError(err instanceof Error ? err.message : 'Gagal memantau status video.');
                if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
                    setError("Kunci API sepertinya tidak valid. Silakan pilih kunci lain.");
                    setApiKeySelected(false);
                }
                setIsLoading(false);
                playSound('error');
            }
        }, 10000); // Poll every 10 seconds
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => stopPolling();
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Prompt tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < VIDEO_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true);
        setError(null);
        setResult(null);
        playSound('start');
        
        const messageInterval = setInterval(() => {
            setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
        }, 3000);

        try {
            if (!(await deductCredits(VIDEO_COST))) throw new Error("Gagal mengurangi token.");
            const op = await generateVideo(prompt, image);
            startPolling(op);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memulai pembuatan video.');
            if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
                setError("Kunci API sepertinya tidak valid. Silakan pilih kunci lain.");
                setApiKeySelected(false);
            }
            setIsLoading(false);
            playSound('error');
        } finally {
            clearInterval(messageInterval);
        }
    };
    
    const handleSaveToProject = async (videoAsset: VideoAsset) => {
        if (!project || !videoAsset) return;
        const currentVideos = project.project_data.sotoshop_assets?.videos || [];
        const newVideos = [...currentVideos, videoAsset];
        try {
           await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, videos: newVideos } });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        }
    };

    const handleFileChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    if (isCheckingApiKey) {
        return <CollapsibleSection title="Generator Video" icon="🎥" initialOpen={false}><p>Mengecek kunci API...</p></CollapsibleSection>;
    }

    if (!apiKeySelected) {
        return (
            <CollapsibleSection title="Generator Video" icon="🎥" initialOpen={true}>
                <div className="p-4 bg-accent/10 rounded-lg text-center">
                    <h4 className="font-bold text-accent">Butuh Kunci API</h4>
                    <p className="text-sm text-text-body my-2">Fitur video Veo memerlukan kunci API dari project Google Cloud Anda yang sudah aktif penagihannya.</p>
                    <p className="text-xs text-text-muted mb-4">Info lebih lanjut di <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">dokumentasi penagihan</a>.</p>
                    <Button onClick={handleSelectApiKey}>Pilih Kunci API</Button>
                </div>
            </CollapsibleSection>
        );
    }

    return (
        <CollapsibleSection title="Generator Video" icon="🎥" initialOpen={false}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Ubah imajinasimu menjadi video pendek. Tulis prompt, atau tambahkan gambar awal untuk memandu AI.</p>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <h4 className="font-semibold text-text-muted text-sm mb-1">Gambar Awal (Opsional)</h4>
                        <label htmlFor="video-img-upload" className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg cursor-pointer hover:bg-border-light/50 p-2">
                            {image ? (
                                <img src={image} alt="Start frame" className="max-w-full max-h-full object-contain rounded"/>
                            ) : (
                                <p className="text-xs text-text-muted text-center">Klik untuk upload gambar awal</p>
                            )}
                        </label>
                        <input id="video-img-upload" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                    </div>
                    <Textarea label="Deskripsi Video (Prompt)" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: seekor kucing astronot melayang di angkasa" rows={4} />
                 </div>
                <Tooltip text="✨ Harga Promo Beta! (Normal: 20 Token)" position="top">
                    <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                        Buat Video! ({VIDEO_COST} Token, +{XP_REWARD} XP)
                    </Button>
                </Tooltip>
                
                {error && <ErrorMessage message={error} />}
                
                {isLoading && (
                    <div className="text-center p-4">
                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-accent-hover font-semibold">{loadingMessage}</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-4 animate-content-fade-in mt-4">
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Video Berhasil Dibuat</h4>
                             <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                            <video src={result.videoUrl} controls className="w-full aspect-video rounded-md" />
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default VideoGenerator;