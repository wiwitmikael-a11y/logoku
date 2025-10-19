// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, extendVideo, checkVideoOperationStatus } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData, VideoAsset } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { Operation, GenerateVideosResponse } from '@google/genai';

const VIDEO_COST_FAST = 5;
const VIDEO_COST_QUALITY = 10;
const XP_REWARD = 100;

type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
type Resolution = '720p' | '1080p';
type AspectRatio = '16:9' | '9:16';

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const loadingMessages = [
    "Mang AI lagi syuting...", "Render di awan...", "Nambahin efek visual...", 
    "Proses color grading...", "Lagi kompres video...", "Dikit lagi kelar!"
];

const VideoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
    const [resolution, setResolution] = useState<Resolution>('720p');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [latestVideo, setLatestVideo] = useState<VideoAsset | null>(null);
    const [extensionPrompt, setExtensionPrompt] = useState('');
    const [isExtending, setIsExtending] = useState(false);
    
    const operationRef = useRef<Operation<GenerateVideosResponse> | null>(null);

    const reset = () => {
        setPrompt('');
        setLatestVideo(null);
        setError(null);
        setExtensionPrompt('');
    };

    const handleGenerate = async (isExtension: boolean = false) => {
        const currentPrompt = isExtension ? extensionPrompt : prompt;
        if (!currentPrompt.trim()) { setError('Prompt tidak boleh kosong!'); return; }
        
        const cost = model === 'veo-3.1-fast-generate-preview' ? VIDEO_COST_FAST : VIDEO_COST_QUALITY;
        if ((profile?.credits ?? 0) < cost) { setError(`Token tidak cukup, butuh ${cost} token.`); return; }

        setIsLoading(true);
        if (isExtension) setIsExtending(true);
        setError(null);
        setLoadingProgress(0);
        
        try {
            if (!(await deductCredits(cost))) throw new Error("Gagal mengurangi token.");

            let op: Operation<GenerateVideosResponse>;
            if (isExtension && latestVideo?.apiReference) {
                op = await extendVideo(latestVideo.apiReference, currentPrompt);
            } else {
                op = await generateVideo(currentPrompt, model, resolution, aspectRatio);
            }
            operationRef.current = op;
            
            // Start polling
            pollOperationStatus();
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memulai pembuatan video.');
            setIsLoading(false);
            if (isExtension) setIsExtending(false);
        }
    };
    
    const pollOperationStatus = () => {
        let progress = 0;
        const intervalId = setInterval(async () => {
            if (operationRef.current && !operationRef.current.done) {
                try {
                    operationRef.current = await checkVideoOperationStatus(operationRef.current);
                    // Simulate progress
                    progress = Math.min(progress + 5, 95); 
                    setLoadingProgress(progress);
                    setCurrentLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
                } catch (e) {
                    setError(`Gagal cek status: ${(e as Error).message}`);
                    clearInterval(intervalId);
                    setIsLoading(false);
                    setIsExtending(false);
                }
            } else if (operationRef.current?.done) {
                clearInterval(intervalId);
                setLoadingProgress(100);
                
                const videoUri = operationRef.current.response?.generatedVideos?.[0]?.video?.uri;
                if (videoUri) {
                    const fullVideoUrl = `${videoUri}&key=${import.meta.env.VITE_API_KEY}`;
                    const newVideoAsset: VideoAsset = {
                        id: `vid_${Date.now()}`,
                        prompt: isExtending ? extensionPrompt : prompt,
                        videoUrl: fullVideoUrl,
                        apiReference: operationRef.current.response?.generatedVideos?.[0]?.video
                    };
                    setLatestVideo(newVideoAsset);
                    await handleSaveToProject(newVideoAsset);
                    await addXp(XP_REWARD);
                } else {
                    setError("Video berhasil dibuat, tapi link tidak ditemukan.");
                }
                
                setIsLoading(false);
                setIsExtending(false);
                setExtensionPrompt('');
            }
        }, 10000); // Poll every 10 seconds
    };

    const handleSaveToProject = async (videoAsset: VideoAsset) => {
        if (!project) return;
        const currentVideos = project.project_data.sotoshop_assets?.videos || [];
        const newVideos = [...currentVideos, videoAsset];
        await onUpdateProject({
            sotoshop_assets: { ...project.project_data.sotoshop_assets, videos: newVideos }
        });
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Video AI (Veo)</h3>
            <p className="text-sm text-text-body">Ubah imajinasimu jadi video pendek. Tulis prompt yang deskriptif, pilih setelan, dan biarkan Mang AI yang jadi sutradaranya.</p>

            <div className="p-4 bg-background rounded-lg border border-border-main space-y-4">
                 <Textarea label="Prompt Video" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: seekor kucing astronot melayang di angkasa dengan latar belakang galaksi nebula, gaya sinematik, kualitas tinggi" rows={3} />
                
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-text-muted">Model AI</label>
                        <select value={model} onChange={e => setModel(e.target.value as VideoModel)} className="w-full text-sm bg-surface p-2 rounded-md border border-border-main">
                            <option value="veo-3.1-fast-generate-preview">Cepat Kilat</option>
                            <option value="veo-3.1-generate-preview">Kualitas Sutradara</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted">Resolusi</label>
                        <select value={resolution} onChange={e => setResolution(e.target.value as Resolution)} className="w-full text-sm bg-surface p-2 rounded-md border border-border-main">
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-muted">Aspek Rasio</label>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="w-full text-sm bg-surface p-2 rounded-md border border-border-main">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                    </div>
                </div>

                <Button onClick={() => handleGenerate(false)} isLoading={isLoading && !isExtending} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                    Buat Video! ({model === 'veo-3.1-fast-generate-preview' ? VIDEO_COST_FAST : VIDEO_COST_QUALITY} Token)
                </Button>
            </div>
            
            {error && <ErrorMessage message={error} />}

            {isLoading && (
                 <div className="p-4 bg-background rounded-lg border border-border-main text-center film-strip-background">
                    <h4 className="font-bold text-white text-lg mb-2">{currentLoadingMessage}</h4>
                    <div className="w-full bg-surface rounded-full h-4">
                        <div className="bg-primary h-4 rounded-full" style={{width: `${loadingProgress}%`, transition: 'width 1s ease-in-out'}}></div>
                    </div>
                    <p className="text-xs text-text-muted mt-2">Proses ini bisa memakan waktu beberapa menit. Sabar ya, Juragan!</p>
                </div>
            )}
            
            {latestVideo && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Video Terbaru</h4>
                        <video src={latestVideo.videoUrl} controls className="w-full rounded-md" />
                    </div>
                    
                    <div className="p-4 bg-background rounded-lg border border-border-main space-y-2">
                        <h4 className="font-bold text-text-header">Mode Sutradara: Perpanjang Video</h4>
                        <Textarea label="Prompt Lanjutan" name="extensionPrompt" value={extensionPrompt} onChange={e => setExtensionPrompt(e.target.value)} placeholder="Contoh: lalu muncul seekor alien lucu melambaikan tangan" rows={2} />
                        <Button onClick={() => handleGenerate(true)} isLoading={isLoading && isExtending} disabled={isLoading || !extensionPrompt.trim()} variant="secondary" className="w-full">
                            Lanjutkan Adegan! ({VIDEO_COST_QUALITY} Token)
                        </Button>
                        <p className="text-xs text-text-muted">Fitur perpanjang video akan menggunakan model Kualitas Sutradara & resolusi 720p.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;