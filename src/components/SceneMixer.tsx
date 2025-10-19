// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateSceneFromImages, enhancePromptWithPersonaStyle } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import AssetPickerModal from './common/AssetPickerModal';

const SCENE_MIXER_COST = 2;
const XP_REWARD = 25;
const MAX_IMAGES = 4;

interface SceneImage {
  src: string;
  instruction: string;
}

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const SceneMixer: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp } = useUserActions();
    
    const [images, setImages] = useState<SceneImage[]>([]);
    const [mainPrompt, setMainPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerTargetIndex, setPickerTargetIndex] = useState(0);

    useEffect(() => {
        reset();
    }, [project]);

    const handleFileChange = (files: FileList | null, index: number) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImages = [...images];
            newImages[index] = { src: e.target?.result as string, instruction: '' };
            setImages(newImages); 
        };
        reader.readAsDataURL(file);
    };
    
    const handleAddImageSlot = () => {
      if (images.length < MAX_IMAGES) {
        setImages([...images, { src: '', instruction: '' }]);
      }
    };
    
    const handleRemoveImageSlot = (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    };
    
    const handleOpenPicker = (index: number) => {
      setPickerTargetIndex(index);
      setIsPickerOpen(true);
    };

    const handleAssetSelect = (url: string) => {
      const newImages = [...images];
      newImages[pickerTargetIndex].src = url;
      setImages(newImages);
    };

    const handleGenerate = async () => {
        const validImages = images.filter(img => img.src);
        if (validImages.length === 0) { setError('Upload minimal 1 gambar!'); return; }
        if (!mainPrompt.trim()) { setError('Prompt utama tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < SCENE_MIXER_COST) { setError(`Token tidak cukup, butuh ${SCENE_MIXER_COST} token.`); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(SCENE_MIXER_COST))) throw new Error("Gagal mengurangi token.");
            
            let combinedPrompt = `${mainPrompt}\n\n`;
            validImages.forEach((img, i) => {
                if (img.instruction.trim()) {
                    combinedPrompt += `Untuk gambar ${i + 1}, fokus pada: "${img.instruction.trim()}".\n`;
                }
            });
            
            const finalPrompt = enhancePromptWithPersonaStyle(combinedPrompt, project.project_data.selectedPersona || null);

            const resultUrl = await generateSceneFromImages(validImages.map(i => i.src), finalPrompt);
            setResult(resultUrl);
            await handleSaveToProject(resultUrl, mainPrompt);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menggabungkan gambar.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async (url: string, prompt: string) => {
        if (!project || !url) return;
        const currentMixes = project.project_data.sotoshop_assets?.sceneMixes || [];
        const newMixes = [...currentMixes, { url, prompt }];
        await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, sceneMixes: newMixes } });
    };
    
    const reset = () => { setImages([]); setMainPrompt(''); setResult(null); setError(null); }

    const ImageSlot: React.FC<{index: number}> = ({ index }) => {
        const image = images[index];
        return (
            <div className="bg-background p-2 rounded-lg border border-border-main space-y-2 relative h-full flex flex-col">
                <button onClick={() => handleRemoveImageSlot(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center z-10 hover:bg-red-700 transition-colors">&times;</button>
                {image.src ? (
                    <>
                        <img src={image.src} alt={`Input ${index+1}`} className="w-full h-24 object-contain rounded"/>
                        <input value={image.instruction} onChange={e => { const newImages = [...images]; newImages[index].instruction = e.target.value; setImages(newImages); }} placeholder={`Instruksi Gbr ${index+1} (opsional)`} className="w-full text-xs bg-surface border border-border-main rounded p-1" />
                    </>
                ) : (
                    <div className="w-full flex-grow flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg gap-2 p-2">
                        <label htmlFor={`mixer-upload-${index}`} className="w-full text-center py-2 bg-surface hover:bg-border-light text-xs font-semibold rounded cursor-pointer">
                            Upload File
                        </label>
                        <button onClick={() => handleOpenPicker(index)} className="w-full text-center py-2 bg-surface hover:bg-border-light text-xs font-semibold rounded">
                            Pilih dari Lemari
                        </button>
                    </div>
                )}
                <input id={`mixer-upload-${index}`} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files, index)} />
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Scene Mixer (Sutradara Gambar)</h3>
            <p className="text-sm text-text-body">Jadilah sutradara! Gabungkan beberapa gambar jadi satu karya baru. Upload atau pilih aset dari Lemari Brand, kasih instruksi, dan tulis prompt utama untuk menyatukannya.</p>

            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-h-[150px]">
                    {images.map((_, index) => <ImageSlot key={index} index={index} />)}
                    {images.length < MAX_IMAGES && (
                        <button onClick={handleAddImageSlot} className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg cursor-pointer hover:bg-border-light text-text-muted transition-colors">
                           <p className="text-2xl">+</p>
                           <p className="text-xs">Tambah Gambar</p>
                        </button>
                    )}
                </div>
                <Textarea label="Prompt Utama (Sutradara)" name="mainPrompt" value={mainPrompt} onChange={e => setMainPrompt(e.target.value)} placeholder="Contoh: Gabungkan maskot kucing (gambar 1) ke pantai (gambar 2) sambil dia minum kopi (gambar 3)." rows={3} />
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || images.filter(i=>i.src).length === 0 || !mainPrompt.trim()} variant="accent" className="w-full">
                    Mulai Syuting! ({SCENE_MIXER_COST} Token, +{XP_REWARD} XP)
                </Button>
            </div>
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Hasil Akhir</h4>
                         <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand.</p>
                        <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Scene Mixer" className="w-full aspect-video object-contain rounded-md cursor-pointer bg-surface" />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => {setResult(null)}} variant="secondary">Oke</Button>
                    </div>
                </div>
            )}
            
            <AssetPickerModal 
                show={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelectAsset={handleAssetSelect}
                assets={project.project_data.sotoshop_assets}
            />
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Scene Mixer" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default SceneMixer;