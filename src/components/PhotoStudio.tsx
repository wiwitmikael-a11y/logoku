// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { editProductImage } from '../services/geminiService'; // Using a generic edit function
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const PHOTO_STUDIO_COST = 2;
const XP_REWARD = 25;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
    initialPrompt?: string | null;
}

type StudioMode = 'scene' | 'edit';

const PhotoStudio: React.FC<Props> = ({ project, onUpdateProject, initialPrompt }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [mode, setMode] = useState<StudioMode>('scene');
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Reset local state when the project prop changes
        reset();
    }, [project]);
    
    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
            setMode('scene'); // Default mode when receiving prompt from calendar
        }
    }, [initialPrompt]);

    const reset = () => { setImage(null); setPrompt(''); setResult(null); setError(null); }

    const handleFileChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setImage(e.target?.result as string);
            setResult(null); // Clear previous result when new image is uploaded
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!image) { setError('Upload gambar produk dulu!'); return; }
        if (!prompt.trim()) { setError('Prompt tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < PHOTO_STUDIO_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(PHOTO_STUDIO_COST))) throw new Error("Gagal mengurangi token.");
            
            let finalPrompt = prompt;
            if (mode === 'scene') {
                finalPrompt = `Tempatkan produk dari gambar ini ke dalam sebuah scene dengan deskripsi: "${prompt}". Pertahankan bentuk asli produknya.`;
            } else { // edit mode
                finalPrompt = `Edit produk di dalam gambar ini sesuai instruksi: "${prompt}". Fokus hanya pada produknya, biarkan background tetap sama.`;
            }
            
            const resultUrl = await editProductImage(image, finalPrompt);
            setResult(resultUrl);
            await handleSaveToProject(resultUrl, prompt);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async (url: string, usedPrompt: string) => {
        if (!project || !url) return;
        
        const currentPhotos = project.project_data.sotoshop_assets?.photoStudio || [];
        const newPhotos = [...currentPhotos, { url, prompt: usedPrompt }];

        try {
           await onUpdateProject({
                sotoshop_assets: {
                    ...project.project_data.sotoshop_assets,
                    photoStudio: newPhotos
                }
            });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Foto AI</h3>
            <p className="text-sm text-text-body">Nggak punya studio foto? Santai. Upload foto produkmu, lalu suruh Mang AI untuk menaruhnya di scene baru atau mengeditnya langsung.</p>
            
            <div className="flex justify-center gap-2 p-1 bg-background rounded-lg">
                <Button size="small" variant={mode === 'scene' ? 'primary' : 'secondary'} onClick={() => setMode('scene')} className="w-full">Ganti Scene</Button>
                <Button size="small" variant={mode === 'edit' ? 'primary' : 'secondary'} onClick={() => setMode('edit')} className="w-full">Edit Produk</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                    <h4 className="font-semibold text-text-muted">1. Upload Foto Produk</h4>
                    <label htmlFor="photo-upload" className={`w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg cursor-pointer hover:bg-border-light ${image ? 'p-2' : ''}`}>
                        {image ? (
                            <img src={image} alt="Product" className="max-w-full max-h-full object-contain rounded"/>
                        ) : (
                            <>
                                <p className="text-2xl text-text-muted">+</p>
                                <p className="text-xs text-text-muted">Klik untuk upload</p>
                            </>
                        )}
                    </label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-text-muted">2. Beri Instruksi AI</h4>
                    <Textarea 
                        label={mode === 'scene' ? 'Deskripsi Scene Baru' : 'Instruksi Edit'}
                        name="prompt" 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={mode === 'scene' ? 'Contoh: di atas meja kayu dengan latar belakang kafe yang blur' : 'Contoh: ubah warna kaosnya jadi hijau army'}
                        rows={5} 
                    />
                </div>
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={!image || !prompt.trim() || isLoading} variant="accent" className="w-full">
                Sulap Fotonya! ({PHOTO_STUDIO_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Hasil Sulap</h4>
                        <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                        <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Studio Foto" className="w-full aspect-square object-contain rounded-md cursor-pointer bg-surface" />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={reset} variant="secondary">Coba Lagi</Button>
                    </div>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Studio Foto" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default PhotoStudio;
