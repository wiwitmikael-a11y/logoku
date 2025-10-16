// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateSceneFromImages } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useUserActions } from './contexts/UserActionsContext';
import { playSound } from './services/soundService';
import { getSupabaseClient } from './services/supabaseClient';
import type { Project } from './types';
import Button from './components/common/Button';
import Textarea from './components/common/Textarea';
import ErrorMessage from './components/common/ErrorMessage';
import LoadingMessage from './components/common/LoadingMessage';
import ImageModal from './components/common/ImageModal';

const SCENE_MIXER_COST = 2;
const XP_REWARD = 25;

interface SceneImage {
  src: string;
  instruction: string;
}

interface SceneMixerProps {
    selectedProjectContext: Project | null;
}

const SceneMixer: React.FC<SceneMixerProps> = ({ selectedProjectContext }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [images, setImages] = useState<SceneImage[]>([]);
    const [mainPrompt, setMainPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const handleFileChange = (files: FileList | null, index: number) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImages = [...images];
            while (newImages.length <= index) {
                newImages.push({ src: '', instruction: '' });
            }
            newImages[index] = { src: e.target?.result as string, instruction: '' };
            setImages(newImages.filter(img => img.src)); 
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        const validImages = images.filter(img => img.src);
        if (validImages.length === 0) { setError('Upload minimal 1 gambar!'); return; }
        if (!mainPrompt.trim()) { setError('Prompt utama tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < SCENE_MIXER_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(SCENE_MIXER_COST))) throw new Error("Gagal mengurangi token.");
            
            let combinedPrompt = `${mainPrompt}\n\n`;
            validImages.forEach((img, i) => {
                if (img.instruction.trim()) {
                    combinedPrompt += `Untuk gambar ${i + 1}, fokus pada: "${img.instruction.trim()}".\n`;
                }
            });

            const resultUrl = await generateSceneFromImages(validImages.map(i => i.src), combinedPrompt);
            setResult(resultUrl);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menggabungkan gambar.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToLemari = async () => {
        if (!user || !result || isSaving) return;
        setIsSaving(true);
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'scene_mixer',
            name: `Mixer: ${mainPrompt.substring(0, 40)}`,
            asset_data: { url: result, prompt: mainPrompt, images },
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Hasil mixer berhasil disimpan ke Lemari Kreasi!'); }
    };
    
    const reset = () => { setImages([]); setMainPrompt(''); setResult(null); setError(null); }

    const ImageSlot: React.FC<{index: number}> = ({ index }) => (
        <div className="bg-background p-2 rounded-lg border border-border-main space-y-2">
            {images[index]?.src ? (
                <>
                    <img src={images[index].src} alt={`Input ${index+1}`} className="w-full h-24 object-cover rounded"/>
                    <input value={images[index].instruction} onChange={e => { const newImages = [...images]; newImages[index].instruction = e.target.value; setImages(newImages); }} placeholder="Instruksi (cth: kucingnya)" className="w-full text-xs bg-surface border border-border-main rounded p-1" />
                </>
            ) : (
                <label htmlFor={`mixer-upload-${index}`} className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-border-main rounded-lg cursor-pointer hover:bg-border-light">
                    <p className="text-2xl text-text-muted">+</p>
                    <p className="text-xs text-text-muted">Upload Gambar {index+1}</p>
                </label>
            )}
            <input id={`mixer-upload-${index}`} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files, index)} />
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Scene Mixer</h3>
            <p className="text-sm text-text-body">Gabungkan beberapa gambar jadi satu karya baru! Upload hingga 3 gambar, kasih instruksi untuk tiap gambar, dan tulis prompt utama untuk menyatukannya.</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ImageSlot index={0} />
                    <ImageSlot index={1} />
                    <ImageSlot index={2} />
                </div>
                <Textarea label="Prompt Utama" name="mainPrompt" value={mainPrompt} onChange={e => setMainPrompt(e.target.value)} placeholder="Contoh: Gabungkan kucing (gambar 1) ke pantai (gambar 2) sambil minum kopi (gambar 3)." rows={3} />
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || images.filter(i=>i.src).length === 0 || !mainPrompt.trim()} variant="accent" className="w-full">
                    Campur Aduk Gambarnya! ({SCENE_MIXER_COST} Token, +{XP_REWARD} XP)
                </Button>
            </div>
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Hasil Gabungan</h4>
                        <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Scene Mixer" className="w-full aspect-square object-contain rounded-md cursor-pointer bg-surface" />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="secondary">Simpan ke Lemari</Button>
                        <Button onClick={reset} variant="secondary">Coba Lagi</Button>
                    </div>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Scene Mixer" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default SceneMixer;