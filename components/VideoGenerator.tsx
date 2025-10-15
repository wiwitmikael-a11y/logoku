// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import * as geminiService from '../services/geminiService';
import type { Project } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import Input from './common/Input';

const VIDEO_GENERATION_COST = 5;
const XP_REWARD = 50;

type AspectRatio = '9:16' | '16:9' | '1:1';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const LOADING_MESSAGES = [
    "Sabar, Mang AI lagi ngerakit kamera...", "Mencari lokasi syuting yang pas...", "Lagi casting pemeran utama...", "Rendering frame 1 dari 120...", "Menambahkan efek sinematik...", "Proses color grading...", "Menyusun adegan demi adegan...", "Lagi bikin kopi buat kru film...", "Finalisasi, nambahin scoring musik...", "Dikit lagi kelar, jangan tinggalin ya!",
];

// ... (previous components inside VideoGenerator)

interface InteractivePromptBuilderProps {
    onGenerate: (prompt: string) => void;
}

const InteractivePromptBuilder: React.FC<InteractivePromptBuilderProps> = ({ onGenerate }) => {
    const [state, setState] = useState({ type: 'Promosi Produk', product: '', feature: '', vibe: 'Modern & Bersih' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setState(prev => ({ ...prev, [name]: value }));
    };

    const generate = () => {
        let generatedPrompt = `Sebuah video untuk ${state.type}.`;
        if (state.product) generatedPrompt += ` Produk utamanya adalah "${state.product}".`;
        if (state.feature) generatedPrompt += ` Sorot keunggulan utamanya: "${state.feature}".`;
        
        switch (state.vibe) {
            case 'Modern & Bersih': generatedPrompt += ` Suasananya modern, bersih, dan minimalis. Gunakan latar belakang warna netral dengan pencahayaan yang terang.`; break;
            case 'Sinematik & Dramatis': generatedPrompt += ` Suasananya sinematik dan dramatis. Gunakan pencahayaan kontras (low-key lighting), gerakan kamera lambat, dan sedikit efek slow-motion.`; break;
            case 'Hangat & Natural': generatedPrompt += ` Suasananya hangat dan natural. Gunakan pencahayaan alami seperti cahaya matahari pagi atau senja. Latar belakangnya elemen alam seperti kayu atau tanaman.`; break;
            case 'Energik & Ceria': generatedPrompt += ` Suasananya energik dan ceria. Gunakan warna-warna cerah, transisi cepat (fast cuts), dan tampilkan ekspresi bahagia.`; break;
        }
        
        generatedPrompt += ` Kualitas video harus 4K, high quality, commercial grade.`;
        onGenerate(generatedPrompt);
    };

    return (
        <div className="space-y-3 p-3 bg-black/20 border border-splash/20 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div> <label className="text-xs font-semibold text-text-muted">Jenis Video</label> <select name="type" value={state.type} onChange={handleChange} className="w-full bg-surface border border-border-main rounded p-1 text-sm"><option>Promosi Produk</option><option>Iklan Sosmed</option><option>Cerita Brand</option><option>Gaya Hidup</option></select> </div>
                <div> <label className="text-xs font-semibold text-text-muted">Suasana Video</label> <select name="vibe" value={state.vibe} onChange={handleChange} className="w-full bg-surface border border-border-main rounded p-1 text-sm"><option>Modern & Bersih</option><option>Sinematik & Dramatis</option><option>Hangat & Natural</option><option>Energik & Ceria</option></select> </div>
            </div>
            <Input label="Nama Produk/Jasa" name="product" value={state.product} onChange={handleChange} placeholder="cth: Kopi Susu Gula Aren" className="!text-sm" />
            <Input label="Keunggulan/Fitur Utama" name="feature" value={state.feature} onChange={handleChange} placeholder="cth: Dibuat dari biji kopi pilihan" className="!text-sm" />
            <Button onClick={generate} size="small" variant="secondary" className="w-full">Buatkan Prompt Canggih!</Button>
        </div>
    );
};


interface PostProductionPanelProps {
    projects: Project[];
    videoUrl: string;
    onRenderComplete: (newUrl: string) => void;
}
const PostProductionPanel: React.FC<PostProductionPanelProps> = ({ projects, videoUrl, onRenderComplete }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [config, setConfig] = useState({ addLogo: true, title: '', subtitle: '' });
    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);

    const completedProjects = useMemo(() => projects.filter(p => p.status === 'completed' && p.project_data.selectedLogoUrl), [projects]);
    const selectedProject = useMemo(() => completedProjects.find(p => p.id.toString() === selectedProjectId), [completedProjects, selectedProjectId]);

    const handleRender = async () => {
        setIsRendering(true);
        setProgress(0);

        try {
            const video = document.createElement('video');
            video.muted = true;
            video.src = videoUrl;
            video.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => { 
                video.onloadedmetadata = resolve;
                video.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context not available");
            
            let logoImage: HTMLImageElement | null = null;
            if (config.addLogo && selectedProject?.project_data.selectedLogoUrl) {
                logoImage = new Image();
                logoImage.crossOrigin = "anonymous";
                logoImage.src = selectedProject.project_data.selectedLogoUrl;
                await new Promise((resolve, reject) => { 
                    logoImage!.onload = resolve;
                    logoImage!.onerror = reject;
                });
            }

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            const chunks: Blob[] = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const newUrl = URL.createObjectURL(blob);
                onRenderComplete(newUrl);
                setIsRendering(false);
            };
            recorder.start();
            
            await video.play();

            const drawFrame = () => {
                if (video.paused || video.ended) {
                    if (recorder.state === 'recording') recorder.stop();
                    return;
                }
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Draw Logo & Watermark
                if (logoImage) {
                    const logoHeight = canvas.height * 0.1;
                    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
                    const padding = canvas.width * 0.02;
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(logoImage, padding, padding, logoWidth, logoHeight);
                    
                    // Add "by desain.fun" text below the logo
                    const watermarkFontSize = Math.max(10, canvas.height * 0.015);
                    ctx.font = `500 ${watermarkFontSize}px "Plus Jakarta Sans"`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 2;
                    ctx.textAlign = 'center';
                    ctx.fillText('by desain.fun', padding + logoWidth / 2, padding + logoHeight + (canvas.height * 0.01) + watermarkFontSize);
                    
                    ctx.globalAlpha = 1.0;
                    ctx.shadowBlur = 0;
                    ctx.textAlign = 'left'; // Reset for other text
                }

                // Draw Text
                if (config.title || config.subtitle) {
                    const padding = canvas.width * 0.05;
                    ctx.textBaseline = 'bottom';
                    
                    if (config.title) {
                        const titleFontSize = Math.max(24, canvas.height * 0.05);
                        ctx.font = `bold ${titleFontSize}px "Plus Jakarta Sans"`;
                        ctx.fillStyle = 'white';
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 5;
                        ctx.fillText(config.title, padding, canvas.height - padding - (config.subtitle ? titleFontSize * 0.5 : 0));
                    }
                    if (config.subtitle) {
                        const subFontSize = Math.max(16, canvas.height * 0.03);
                        ctx.font = `normal ${subFontSize}px "Plus Jakarta Sans"`;
                        ctx.fillStyle = 'white';
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 3;
                        ctx.fillText(config.subtitle, padding, canvas.height - padding);
                    }
                    ctx.shadowBlur = 0;
                }
                
                setProgress((video.currentTime / video.duration) * 100);
                requestAnimationFrame(drawFrame);
            };

            drawFrame();
        } catch (err) {
            console.error("Rendering error:", err);
            setIsRendering(false);
            alert("Waduh, gagal merender video. Coba muat ulang halaman dan ulangi. Pastikan project yang dipilih punya logo yang valid.");
        }
    };
    
    return (
        <div className="space-y-4 p-4 bg-black/20 border border-splash/20 rounded-lg">
            <h4 className="text-lg font-bold text-splash">Studio Pasca-Produksi</h4>
            {isRendering ? (
                <div className="text-center">
                    <p className="text-sm font-semibold text-text-header animate-pulse">Merender video baru...</p>
                    <div className="w-full bg-background rounded-full h-2.5 mt-2"><div className="bg-splash h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                </div>
            ) : (
                <>
                     {completedProjects.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-text-muted">Pilih Project (untuk Ambil Logo)</label>
                            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-surface border border-border-main rounded p-1 text-sm">
                                <option value="">-- Tanpa Logo --</option>
                                {completedProjects.map(p => <option key={p.id} value={p.id}>{p.project_data.brandInputs?.businessName}</option>)}
                            </select>
                        </div>
                    )}
                    <Input label="Judul (Opsional)" value={config.title} onChange={e => setConfig(p => ({...p, title: e.target.value}))} placeholder="cth: PROMO SPESIAL!" />
                    <Input label="Subtitle (Opsional)" value={config.subtitle} onChange={e => setConfig(p => ({...p, subtitle: e.target.value}))} placeholder="cth: Beli 1 Gratis 1" />
                    <Button onClick={handleRender} disabled={isRendering} className="w-full">Terapkan & Render Ulang Video</Button>
                </>
            )}
        </div>
    );
};


interface Props {
  projects: Project[];
}

const VideoGenerator: React.FC<Props> = ({ projects }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const credits = profile?.credits ?? 0;

    const [prompt, setPrompt] = useState('');
    const [useInteractiveBuilder, setUseInteractiveBuilder] = useState(true);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
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
        if (!prompt) { setError('Prompt tidak boleh kosong!'); return; }
        if (credits < VIDEO_GENERATION_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setVideoUrl(null); setLoadingMessage(LOADING_MESSAGES[0]);
        playSound('start');

        try {
            if (!(await deductCredits(VIDEO_GENERATION_COST))) throw new Error("Gagal mengurangi token.");
            const resultUrl = await geminiService.generateVideo(prompt, imageBase64, aspectRatio);
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

    const aspectRatioOptions = [
        { id: '16:9', label: 'YouTube / Web', icon: 'YT' },
        { id: '9:16', label: 'Reels / TikTok', icon: 'IG' },
        { id: '1:1', label: 'Feed Instagram', icon: 'Feed' },
    ];

    return (
        <div className="space-y-4 animate-content-fade-in">
            <p className="text-splash font-bold text-sm">VIDEO GENERATOR:</p>
            <p className="text-white text-sm">Ubah idemu jadi video pendek sinematik! Cukup tuliskan prompt, atau tambahkan gambar sebagai referensi visual. Proses ini butuh waktu beberapa menit, jadi mohon bersabar ya, Juragan.</p>
            <p className="text-xs text-text-muted">Biaya: {VIDEO_GENERATION_COST} Token | Hadiah: +{XP_REWARD} XP. <strong className="text-yellow-400">Catatan: Video yang dihasilkan akan memiliki watermark dari Google.</strong></p>

            {!isLoading && !videoUrl && (
                <div className="space-y-4 pt-2">
                     <div className="space-y-2">
                        <label className="text-text-header font-semibold text-sm block">1. Pilih Format Video</label>
                        <div className="grid grid-cols-3 gap-3">
                            {aspectRatioOptions.map(opt => (
                                <button key={opt.id} onClick={() => setAspectRatio(opt.id as AspectRatio)} className={`p-3 border rounded-lg transition-colors ${aspectRatio === opt.id ? 'bg-primary/20 border-primary' : 'bg-background/50 border-border-main hover:border-splash/50'}`}>
                                    <div className="font-bold text-lg text-primary">{opt.icon}</div>
                                    <div className={`font-semibold text-xs ${aspectRatio === opt.id ? 'text-text-header' : 'text-text-muted'}`}>{opt.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-text-header font-semibold text-sm">2. Deskripsikan Videomu</label>
                            <button onClick={() => setUseInteractiveBuilder(p => !p)} className="text-xs text-primary hover:underline">{useInteractiveBuilder ? 'Mode Manual' : 'Pakai Asisten Prompt'}</button>
                        </div>
                        {useInteractiveBuilder ? (
                             <InteractivePromptBuilder onGenerate={(p) => { setPrompt(p); setUseInteractiveBuilder(false); }} />
                        ) : (
                            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Contoh: seekor kucing oren mengendarai sepeda motor dengan kecepatan tinggi di jalanan neon Tokyo" rows={4} />
                        )}
                    </div>
                    <div 
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                        className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border-main'}`}
                    >
                        {imageBase64 ? (
                            <div className="relative"> <img src={imageBase64} alt="Preview" className="max-h-32 rounded-md" /> <button onClick={() => setImageBase64(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 font-bold">&times;</button> </div>
                        ) : (
                            <> <label className="text-text-header font-semibold text-sm">3. Tambah Gambar (Opsional)</label> <p className="text-text-muted text-sm mt-1">Seret & lepas gambar di sini, atau <label htmlFor="video-image-upload" className="text-primary hover:underline cursor-pointer font-semibold">Pilih File</label></p> <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFileChange(e.target.files)} /> </>
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
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-300 text-sm">
                        <h4 className="font-bold text-yellow-200">🚨 PENTING: VIDEO BERSIFAT SEMENTARA!</h4>
                        <p className="mt-1">Video ini TIDAK disimpan di server. <strong className="text-white">Segera UNDUH video ini</strong>, karena akan HILANG jika kamu me-refresh atau menutup halaman.</p>
                    </div>
                    <h3 className="text-lg font-bold text-green-400">Video Berhasil Dibuat!</h3>
                    <video key={videoUrl} src={videoUrl} controls controlsList="nodownload" className="w-full rounded-lg border border-border-main" />
                    <PostProductionPanel projects={projects} videoUrl={videoUrl} onRenderComplete={setVideoUrl} />
                    <div className="flex gap-4">
                        <a href={videoUrl} download={`${prompt.substring(0, 20).replace(/\s/g, '_')}.webm`} className="w-full">
                            <Button variant="accent" className="w-full">Unduh Video Ini!</Button>
                        </a>
                        <Button onClick={() => { setVideoUrl(null); setPrompt(''); setImageBase64(null); }} variant="secondary" className="w-full">Bikin Video Lain</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;