// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { editProductImage } from '../services/geminiService'; // Using a generic edit function
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Select from './common/Select';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import CollapsibleSection from './common/CollapsibleSection';

const PHOTO_STUDIO_COST = 2;
const XP_REWARD = 25;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
    initialPrompt?: string | null;
}

const PhotoStudio: React.FC<Props> = ({ project, onUpdateProject, initialPrompt }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [lighting, setLighting] = useState('Studio soft light');
    const [angle, setAngle] = useState('Eye-level');
    const [background, setBackground] = useState('Clean white background');
    
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    useEffect(() => {
        reset();
    }, [project]);
    
    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
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
            setResult(null); 
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
            
            const finalPrompt = `Place the product from the image into a new photorealistic scene. The scene is described as: "${prompt}". Use "${lighting}" lighting, from a "${angle}" camera angle, on a "${background}". Keep the original product shape and details.`;
            
            const resultUrl = await editProductImage(image, finalPrompt, project.project_data.selectedPersona);
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
           await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, photoStudio: newPhotos } });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        }
    };

    return (
        <CollapsibleSection title="Studio Foto AI" icon="📷" initialOpen={!!initialPrompt}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Nggak punya studio foto? Santai. Upload foto produkmu, lalu suruh Mang AI untuk menaruhnya di scene baru atau mengeditnya langsung.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-text-muted">1. Upload Foto Produk</h4>
                        <label htmlFor="photo-upload" className={`w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg cursor-pointer hover:bg-border-light/50 ${image ? 'p-2' : ''}`}>
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
                    <div className="space-y-4">
                         <h4 className="font-semibold text-text-muted">2. Atur Parameter</h4>
                        <Select label="Gaya Pencahayaan" name="lighting" value={lighting} onChange={e => setLighting(e.target.value)} options={[ {value: 'Studio soft light', label: 'Studio (Lembut)'}, {value: 'Golden hour sunlight', label: 'Senja (Golden Hour)'}, {value: 'Dramatic cinematic lighting', label: 'Sinematik Dramatis'}, {value: 'Bright natural daylight', label: 'Siang Hari Terang'} ]} />
                        <Select label="Sudut Kamera" name="angle" value={angle} onChange={e => setAngle(e.target.value)} options={[ {value: 'Eye-level shot', label: 'Sejajar Mata'}, {value: 'Low-angle shot', label: 'Dari Bawah'}, {value: 'High-angle shot', label: 'Dari Atas'}, {value: 'Top-down shot', label: 'Flat Lay (Tampak Atas)'} ]} />
                        <Textarea label="Deskripsi Scene" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: di atas meja kayu dengan latar kafe blur" rows={3} />
                    </div>
                </div>

                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!image || !prompt.trim() || isLoading} variant="accent" className="w-full">
                    Sulap Fotonya! ({PHOTO_STUDIO_COST} ✨, +{XP_REWARD} XP)
                </Button>
                
                {error && <ErrorMessage message={error} />}
                {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

                {result && (
                    <div className="space-y-4 animate-content-fade-in mt-4">
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Hasil Sulap</h4>
                            <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                            <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Studio Foto" className="w-full aspect-square object-contain rounded-md cursor-pointer bg-surface/50" />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={reset} variant="secondary">Coba Lagi</Button>
                        </div>
                    </div>
                )}
                {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Studio Foto" onClose={() => setModalImageUrl(null)} />}
            </div>
        </CollapsibleSection>
    );
};

export default PhotoStudio;