// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateVideo, checkVideoOperationStatus, extendVideo } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData, VideoAsset } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { Operation, GenerateVideosResponse } from '@google/genai';

const VIDEO_GEN_COST = 10;
const XP_REWARD = 100;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const VideoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [latestVideo, setLatestVideo] = useState<VideoAsset | null>(null);
    const [extendPrompt, setExtendPrompt] = useState('');

    const pollOperation = async (operation: Operation<GenerateVideosResponse>, initialPrompt: string) => {
        let op = operation;
        while (!op.done) {
            setStatusMessage('Mang AI lagi bikin video, proses ini bisa beberapa menit. Sabar ya...');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            try {
                op = await checkVideoOperationStatus(op);
            } catch (err) {
                setError(`Gagal memeriksa status video: ${(err as Error).message}`);
                setIsLoading(false);
                return;
            }
        }

        const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            const videoUrl = `${videoUri}&key=${import.meta.env.VITE_API_KEY}`;
            const newVideoAsset: VideoAsset = {
                id: `vid_${Date.now()}`,
                prompt: initialPrompt,
                videoUrl: videoUrl,
                apiReference: op.response?.generatedVideos?.[0]?.video,
            };
            setLatestVideo(newVideoAsset);
            await handleSaveToProject(newVideoAsset);
            await addXp(XP_REWARD);
            playSound('success');
            setStatusMessage('Video berhasil dibuat!');
        } else {
            setError('Gagal mendapatkan URL video dari hasil operasi.');
        }
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Prompt tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < VIDEO_GEN_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setStatusMessage(''); setLatestVideo(null); playSound('start');
        try {
            if (!(await deductCredits(VIDEO_GEN_COST))) throw new Error("Gagal mengurangi token.");
            const operation = await generateVideo(prompt, 'veo-3.1-fast-generate-preview', '720p', '16:9');
            pollOperation(operation, prompt);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memulai pembuatan video.');
            setIsLoading(false);
            playSound('error');
        }
    };
    
    const handleExtend = async () => {
        if (!extendPrompt.trim() || !latestVideo?.apiReference) {
            setError('Video terakhir tidak ditemukan atau prompt kosong.');
            return;
        }
        if ((profile?.credits ?? 0) < VIDEO_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setStatusMessage(''); playSound('start');
        try {
            if (!(await deductCredits(VIDEO_GEN_COST))) throw new Error("Gagal mengurangi token.");
            const operation = await extendVideo(latestVideo.apiReference, extendPrompt);
            pollOperation(operation, `${latestVideo.prompt} | Lanjutan: ${extendPrompt}`);
            setExtendPrompt('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memperpanjang video.');
            setIsLoading(false);
            playSound('error');
        }
    };

    const handleSaveToProject = async (videoAsset: VideoAsset) => {
        const currentVideos = project.project_data.sotoshop_assets?.videos || [];
        const newVideos = [...currentVideos, videoAsset];
        await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, videos: newVideos } });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Video Veo</h3>
            <p className="text-sm text-text-body">Buat video pendek dari teks. Cukup tulis idemu, dan Mang AI akan membuatkan video sinematik untukmu. Proses ini butuh waktu beberapa menit.</p>

            <div className="space-y-2">
                <Textarea label="Deskripsi Video" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: seekor astronot mengendarai kuda di Mars, gaya sinematik" rows={3} />
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                Buat Video! ({VIDEO_GEN_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <p className="text-center text-sm text-accent">{statusMessage}</p>}

            {latestVideo && !isLoading && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Video Terbaru</h4>
                        <video src={latestVideo.videoUrl} controls className="w-full aspect-video rounded-md" />
                    </div>
                     <div className="p-4 bg-background rounded-lg border border-border-main space-y-2">
                         <h4 className="font-bold text-text-header">Perpanjang Video</h4>
                        <Textarea label="Apa yang terjadi selanjutnya?" name="extendPrompt" value={extendPrompt} onChange={e => setExtendPrompt(e.target.value)} placeholder="Contoh: tiba-tiba sebuah UFO mendarat di dekatnya" rows={2} />
                        <Button onClick={handleExtend} isLoading={isLoading} disabled={isLoading || !extendPrompt.trim()} variant="secondary">Lanjutkan Cerita ({VIDEO_GEN_COST} T)</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;
