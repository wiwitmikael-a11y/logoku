// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, Suspense, useRef } from 'react';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import { removeBackground } from '../services/geminiService';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';

const PhotoStudio = React.lazy(() => import('./PhotoStudio'));
const SceneMixer = React.lazy(() => import('./SceneMixer'));
const MoodboardGenerator = React.lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = React.lazy(() => import('./PatternGenerator'));
const MascotGenerator = React.lazy(() => import('./MascotGenerator'));

type CreatorTool = 'photo_studio' | 'scene_mixer' | 'moodboard' | 'pattern' | 'mascot';

interface AICreatorProps {
    projects: Project[];
    onShowSotoshop: () => void;
}

const AICreator: React.FC<AICreatorProps> = ({ projects, onShowSotoshop }) => {
    const [activeTool, setActiveTool] = useState<CreatorTool>('photo_studio');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('freestyle');

    const { profile } = useAuth();
    const { deductCredits, setShowOutOfCreditsModal, addXp } = useUserActions();

    const [ownerPhotoOriginal, setOwnerPhotoOriginal] = useState<string | null>(null);
    const [ownerPhotoCutout, setOwnerPhotoCutout] = useState<string | null>(null);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [ownerAssetError, setOwnerAssetError] = useState<string | null>(null);

    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const completedProjects = projects.filter(p => p.status === 'completed');
    const selectedProjectContext = selectedProjectId === 'freestyle' ? null : completedProjects.find(p => p.id === parseInt(selectedProjectId)) || null;

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setOwnerAssetError('File yang dipilih harus berupa gambar.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setOwnerPhotoOriginal(e.target?.result as string);
            setOwnerPhotoCutout(null); // Reset cutout when new image is uploaded
            setOwnerAssetError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleProcessFace = async () => {
        if (!ownerPhotoOriginal || isRemovingBg) return;
        if ((profile?.credits ?? 0) < 1) {
            setShowOutOfCreditsModal(true);
            return;
        }
        
        setIsRemovingBg(true);
        setOwnerAssetError(null);
        playSound('start');

        try {
            if (!(await deductCredits(1))) throw new Error("Gagal mengurangi token.");
            
            const resultBase64 = await removeBackground(ownerPhotoOriginal);
            setOwnerPhotoCutout(resultBase64);
            await addXp(10);
            playSound('success');

        } catch (err) {
            setOwnerAssetError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
            playSound('error');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const clearOwnerAsset = () => {
        setOwnerPhotoOriginal(null);
        setOwnerPhotoCutout(null);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    }

    const renderActiveTool = () => {
        const props = { selectedProjectContext, ownerPhotoCutout };
        switch (activeTool) {
            case 'photo_studio': return <Suspense fallback={<LoadingMessage />}><PhotoStudio {...props} /></Suspense>;
            case 'scene_mixer': return <Suspense fallback={<LoadingMessage />}><SceneMixer {...props} /></Suspense>;
            case 'moodboard': return <Suspense fallback={<LoadingMessage />}><MoodboardGenerator {...props} /></Suspense>;
            case 'pattern': return <Suspense fallback={<LoadingMessage />}><PatternGenerator {...props} /></Suspense>;
            case 'mascot': return <Suspense fallback={<LoadingMessage />}><MascotGenerator {...props} /></Suspense>;
            default: return <p>Pilih alat untuk memulai.</p>;
        }
    };

    const tools = [
        { id: 'photo_studio', name: 'Studio Foto Virtual', icon: '📸' },
        { id: 'scene_mixer', name: 'Scene Mixer', icon: '🧩' },
        { id: 'moodboard', name: 'Asisten Vibe Brand', icon: '🎨' },
        { id: 'pattern', name: 'Studio Motif Brand', icon: '🌀' },
        { id: 'mascot', name: 'Pabrik Maskot Interaktif', icon: '🐻' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
             <input type="file" accept="image/*" ref={galleryInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} className="hidden" />
             <input type="file" accept="image/*" capture="user" ref={cameraInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} className="hidden" />

            {/* Left Sidebar */}
            <aside className="w-full lg:w-1/4 xl:w-1/5 flex-shrink-0 space-y-6">
                <div className="p-4 bg-surface rounded-lg border border-border-main">
                    <h3 className="font-bold text-text-header mb-3">Navigasi CreAItor</h3>
                    <nav className="space-y-2">
                        {tools.map(tool => (
                            <button key={tool.id} onClick={() => setActiveTool(tool.id as CreatorTool)} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${activeTool === tool.id ? 'bg-primary text-white font-semibold' : 'text-text-body hover:bg-background'}`}>
                                <span>{tool.icon}</span><span>{tool.name}</span>
                            </button>
                        ))}
                    </nav>
                     <div className="mt-4 pt-4 border-t border-border-main">
                        <button onClick={onShowSotoshop} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left text-text-body hover:bg-background">
                            <span>✨</span><span>Buka Sotoshop</span>
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-surface rounded-lg border border-border-main space-y-3">
                    <h3 className="font-bold text-text-header">Konteks Brand</h3>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full px-3 py-2 text-text-body bg-background border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-splash/50 focus:border-splash transition-colors">
                        <option value="freestyle">Mode Freestyle</option>
                        {completedProjects.map(p => <option key={p.id} value={p.id}>{p.project_data.brandInputs?.businessName}</option>)}
                    </select>
                     {selectedProjectContext && (
                        <div className="text-xs text-primary bg-primary/10 p-2 rounded-md">
                            Keren! CreAItor sekarang pakai data dari brand "{selectedProjectContext.project_data.brandInputs?.businessName}".
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-surface rounded-lg border border-border-main space-y-3">
                    <h3 className="font-bold text-text-header">Aset Persona Juragan</h3>
                    <div className="bg-background p-3 rounded-lg flex flex-col items-center justify-center min-h-[150px]">
                        {ownerPhotoCutout ? (
                             <img src={ownerPhotoCutout} alt="Owner Cutout" className="max-w-full max-h-32 object-contain" />
                        ) : ownerPhotoOriginal ? (
                             <img src={ownerPhotoOriginal} alt="Owner Original" className="max-w-full max-h-32 object-contain" />
                        ) : (
                            <div className="text-center text-text-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-xs mt-2">Upload fotomu buat jadi model!</p>
                            </div>
                        )}
                    </div>
                     {ownerAssetError && <ErrorMessage message={ownerAssetError} />}
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => cameraInputRef.current?.click()} size="small" variant="secondary">📸 Ambil Foto</Button>
                        <Button onClick={() => galleryInputRef.current?.click()} size="small" variant="secondary">🖼️ Dari Galeri</Button>
                    </div>
                     {ownerPhotoOriginal && (
                        <Button onClick={handleProcessFace} isLoading={isRemovingBg} disabled={isRemovingBg} variant="accent" className="w-full">
                           {ownerPhotoCutout ? "Proses Ulang (1 Token)" : "Proses Wajah (1 Token)"}
                        </Button>
                    )}
                    {(ownerPhotoOriginal || ownerPhotoCutout) && (
                         <Button onClick={clearOwnerAsset} size="small" variant="secondary" className="w-full !text-red-500 !border-red-500/20 hover:!bg-red-500/10">Hapus Foto</Button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="w-full lg:flex-1 bg-surface p-6 rounded-lg border border-border-main">
                {renderActiveTool()}
            </main>
        </div>
    );
};

export default AICreator;