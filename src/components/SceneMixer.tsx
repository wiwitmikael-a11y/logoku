// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { mixScene } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import CollapsibleSection from './common/CollapsibleSection';
import AssetPickerModal from './common/AssetPickerModal';

const SCENE_MIXER_COST = 5; // Disesuaikan untuk subsidi
const XP_REWARD = 30;

interface Props {
    project: Project;
    onUpdateProject: (data: any) => Promise<void>;
}

const SceneMixer: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [image1, setImage1] = useState<string | null>(null);
    const [image2, setImage2] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [showAssetPicker, setShowAssetPicker] = useState<'image1' | 'image2' | null>(null);

    useEffect(() => {
        reset();
    }, [project]);

    const reset = () => { setImage1(null); setImage2(null); setPrompt(''); setResult(null); setError(null); }

    const handleFileChange = (files: FileList | null, target: 'image1' | 'image2') => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (target === 'image1') setImage1(imageUrl);
            else setImage2(imageUrl);
            setResult(null); 
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!image1 || !image2 || !prompt.trim()) { setError('Pilih 2 gambar dan isi prompt!'); return; }
        if ((profile?.credits ?? 0) < SCENE_MIXER_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(SCENE_MIXER_COST))) throw new Error("Gagal mengurangi token.");
            
            const resultUrl = await mixScene(image1, image2, prompt, project.project_data.selectedPersona);
            setResult(resultUrl);
            await handleSaveToProject(resultUrl, prompt);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menggabungkan gambar.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async (url: string, usedPrompt: string) => {
        if (!project || !url) return;
        const currentMixes = project.project_data.sotoshop_assets?.sceneMixes || [];
        const newMixes = [...currentMixes, { url, prompt: usedPrompt }];
        try {
           await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, sceneMixes: newMixes } });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        }
    };

    const ImageInput: React.FC<{
        image: string | null;
        onFileChange: (files: FileList | null) => void;
        onAssetPickerOpen: () => void;
        id: string;
        label: string;
    }> = ({ image, onFileChange, onAssetPickerOpen, id, label }) => (
        <div className="space-y-2">
            <h4 className="font-semibold text-text-muted">{label}</h4>
            <div className={`w-full aspect-square border-2 border-dashed border-border-main rounded-lg flex flex-col items-center justify-center p-2`}>
                {image ? (
                    <img src={image} alt="Input" className="max-w-full max-h-full object-contain rounded"/>
                ) : (
                    <p className="text-xs text-text-muted text-center">Upload atau Pilih dari Lemari Brand</p>
                )}
            </div>
            <div className="flex gap-2">
                <label htmlFor={id} className="flex-1 text-center px-3 py-2 text-sm bg-surface rounded-md cursor-pointer hover:bg-border-light">Upload</label>
                <input id={id} type="file" accept="image/*" className="hidden" onChange={e => onFileChange(e.target.files)} />
                <Button onClick={onAssetPickerOpen} variant="secondary" size="small" className="flex-1">Pilih Aset</Button>
            </div>
        </div>
    );

    return (
        <CollapsibleSection title="Scene Mixer" icon="🎭" initialOpen={false}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Gabungkan dua gambar menjadi satu adegan baru yang imajinatif. Masukkan dua gambar sumber dan jelaskan bagaimana Mang AI harus menggabungkannya.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <ImageInput image={image1} onFileChange={(f) => handleFileChange(f, 'image1')} onAssetPickerOpen={() => setShowAssetPicker('image1')} id="mixer-upload-1" label="Gambar 1" />
                    
                    <div className="text-center md:pb-12">
                        <span className="text-4xl font-bold text-primary">+</span>
                    </div>

                    <ImageInput image={image2} onFileChange={(f) => handleFileChange(f, 'image2')} onAssetPickerOpen={() => setShowAssetPicker('image2')} id="mixer-upload-2" label="Gambar 2" />
                </div>
                
                <Textarea label="Jelaskan cara menggabungkannya" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: letakkan karakter dari gambar 1 di dalam lingkungan dari gambar 2" rows={2} />

                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!image1 || !image2 || !prompt.trim() || isLoading} variant="accent" className="w-full">
                    Gabungkan Scene! ({SCENE_MIXER_COST} Token, +{XP_REWARD} XP)
                </Button>
                
                {error && <ErrorMessage message={error} />}
                {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

                {result && (
                    <div className="space-y-4 animate-content-fade-in mt-4">
                         <div className="p-4 bg-background/50 rounded-lg border border-border-main relative group">
                            <h4 className="font-bold text-text-header mb-2">Hasil Gabungan</h4>
                            <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                            <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Scene Mixer" className="w-full aspect-square object-contain rounded-md cursor-pointer bg-surface/50" />
                        </div>
                    </div>
                )}
                {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Scene Mixer" onClose={() => setModalImageUrl(null)} />}
                <AssetPickerModal 
                    show={!!showAssetPicker}
                    onClose={() => setShowAssetPicker(null)}
                    assets={project.project_data.sotoshop_assets}
                    onSelectAsset={(url) => {
                        if (showAssetPicker === 'image1') setImage1(url);
                        if (showAssetPicker === 'image2') setImage2(url);
                    }}
                />
            </div>
        </CollapsibleSection>
    );
};

export default SceneMixer;