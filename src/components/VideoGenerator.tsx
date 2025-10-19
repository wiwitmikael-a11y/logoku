// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateVideo, enhancePromptWithPersonaStyle } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

declare global {
    interface Window {
        aistudio?: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        }
    }
}

const VIDEO_COST = 25;
const XP_REWARD = 200;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const VideoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [hasSelectedKey, setHasSelectedKey] = useState(false);
    
    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasSelectedKey(selected);
            } else {
                setHasSelectedKey(true); // Assume key is via env for local dev
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setHasSelectedKey(true); // Assume success to avoid race condition
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !project.project_data.selectedPersona) {
            setError('Prompt dan persona brand dibutuhkan.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        try {
            if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
                setHasSelectedKey(false);
                throw new Error("Pilih API Key terlebih dahulu untuk menggunakan fitur video.");
            }

            if (!(await deductCredits(VIDEO_COST))) return;

            const finalPrompt = enhancePromptWithPersonaStyle(prompt, project.project_data.selectedPersona);
            const url = await generateVideo(finalPrompt);
            setVideoUrl(url);

            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            let errorMessage = err instanceof Error ? err.message : 'Gagal membuat video.';
            if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
                errorMessage = "API Key sepertinya tidak valid. Silakan pilih kembali.";
                setHasSelectedKey(false);
            }
            setError(errorMessage);
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!project.project_data.selectedPersona) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl">👤</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona Dulu!</h2>
                <p className="mt-2 text-text-muted max-w-md">Video akan dibuat berdasarkan gaya dan warna dari persona brand-mu.</p>
            </div>
        );
    }
    
    if (!hasSelectedKey) {
        return (
             <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl">🔑</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Membutuhkan API Key</h2>
                <p className="mt-2 text-text-muted max-w-md">Fitur generator video menggunakan model Veo yang memerlukan Anda untuk memilih API key Anda sendiri.</p>
                <p className="text-xs text-text-muted mt-2">Pastikan proyek Google Cloud Anda sudah terhubung dengan akun penagihan. Info lebih lanjut di <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary underline">dokumentasi penagihan</a>.</p>
                <Button onClick={handleSelectKey} className="mt-6">Pilih API Key</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h3 className="text-3xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Studio Video AI</h3>
            <p className="text-sm text-text-body">Ubah idemu menjadi video pendek yang sinematik. Deskripsikan adegan yang kamu mau, dan biarkan AI yang bekerja. Proses ini bisa memakan waktu beberapa menit.</p>
            
            <div className="p-6 bg-surface rounded-lg space-y-4">
                <Textarea
                    label="Deskripsi Video"
                    name="videoPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: seekor kucing astronot melayang di angkasa, sinematik, detail tinggi"
                    rows={4}
                />
                 {project.project_data.selectedPersona && (
                    <p className="text-xs text-primary animate-content-fade-in">✨ Gaya video akan disempurnakan dengan gaya visual dari brand "{project.project_name}".</p>
                )}
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt.trim()} className="w-full">
                    Buat Video! ({VIDEO_COST} Token, +{XP_REWARD} XP)
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}

            {isLoading && (
                 <div className="text-center p-8 bg-surface rounded-lg">
                    <h4 className="font-bold text-lg text-primary animate-pulse">Sedang Merender Video...</h4>
                    <p className="text-text-muted mt-2">Proses ini bisa makan waktu 1-3 menit. Sabar ya, Juragan, kopi dulu aja!</p>
                </div>
            )}

            {videoUrl && (
                <div className="p-4 bg-background rounded-lg animate-content-fade-in">
                    <h4 className="font-bold text-text-header mb-2">Video Berhasil Dibuat!</h4>
                    <video
                        controls
                        src={`${videoUrl}&key=${import.meta.env.VITE_API_KEY}`}
                        className="w-full rounded-lg"
                    />
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;
