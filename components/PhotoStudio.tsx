// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateProductPhoto, removeBackground } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import { supabase } from '../services/supabaseClient';
import type { Project } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const PHOTO_STUDIO_COST = 1;
const BG_REMOVAL_COST = 1;
const XP_REWARD = 25;

const SCENE_SUGGESTIONS = ["di atas meja marmer putih dengan properti minimalis", "di atas podium kayu dengan latar belakang alam", "melayang dengan latar belakang gradien pastel", "di pantai dengan cahaya matahari terbenam"];

interface PhotoStudioProps {
    selectedProjectContext: Project | null;
    ownerPhotoCutout: string | null;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ selectedProjectContext, ownerPhotoCutout }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [scenePrompt, setScenePrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (ownerPhotoCutout) {
            setOriginalImage(ownerPhotoCutout); // Assume owner photo is already a cutout
            setProductImage(ownerPhotoCutout);
        }
    }, [ownerPhotoCutout]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setOriginalImage(event.target?.result as string);
                setProductImage(null); // Reset cutout when new image is uploaded
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveBg = async () => {
        if (!originalImage || isRemovingBg) return;
        if ((profile?.credits ?? 0) < BG_REMOVAL_COST) { setShowOutOfCreditsModal(true); return; }

        setIsRemovingBg(true); setError(null);
        try {
            if (!(await deductCredits(BG_REMOVAL_COST))) throw new Error("Gagal mengurangi token.");
            const cutout = await removeBackground(originalImage);
            setProductImage(cutout);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menghapus background.');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const handleGenerate = async () => {
        if (!productImage) { setError('Hapus background dulu atau upload gambar tanpa background.'); return; }
        if (!scenePrompt.trim()) { setError('Deskripsi suasana tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < PHOTO_STUDIO_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(PHOTO_STUDIO_COST))) throw new Error("Gagal mengurangi token.");
            
            const photoUrl = await generateProductPhoto(productImage, scenePrompt);
            setResult(photoUrl);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat foto produk.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToLemari = async () => {
        if (!user || !result || isSaving) return;
        setIsSaving(true);
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'photo_studio',
            name: `Studio: ${scenePrompt.substring(0, 40)}`,
            asset_data: { url: result, prompt: scenePrompt, original: originalImage },
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Foto berhasil disimpan ke Lemari Kreasi!'); }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Foto Virtual</h3>
            <p className="text-sm text-text-body">Gak perlu sewa studio mahal! Upload foto produkmu (atau pakai Persona Juragan), hapus background-nya, dan letakkan di berbagai suasana profesional.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-muted">Langkah 1: Siapkan Objek</label>
                    <div className="p-2 bg-background rounded-lg border border-border-main min-h-[200px] flex items-center justify-center">
                        {originalImage ? <img src={productImage || originalImage} alt="Product" className="max-h-48 object-contain" /> : <label htmlFor="studio-upload" className="cursor-pointer text-center text-text-muted hover:text-text-header">Klik untuk upload gambar</label>}
                        <input id="studio-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    {originalImage && !productImage && (
                        <Button onClick={handleRemoveBg} isLoading={isRemovingBg} className="w-full">Hapus Background ({BG_REMOVAL_COST} Token)</Button>
                    )}
                     {originalImage && productImage && (
                        <p className="text-xs text-center text-green-400">✓ Background sudah dihapus. Siap ke langkah 2.</p>
                    )}
                </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-muted">Langkah 2: Tentukan Suasana</label>
                    <Textarea label="" name="scenePrompt" value={scenePrompt} onChange={e => setScenePrompt(e.target.value)} placeholder="Contoh: di atas meja marmer dengan daun tropis" rows={4} />
                    <div className="flex flex-wrap gap-2">
                        {SCENE_SUGGESTIONS.map(s => <button key={s} onClick={() => setScenePrompt(s)} className="text-xs bg-background text-text-body px-2 py-1 rounded-md hover:bg-border-light">{s}</button>)}
                    </div>
                </div>
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !productImage || !scenePrompt.trim()} variant="accent" className="w-full">
                Jepret Fotonya! ({PHOTO_STUDIO_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}
            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Foto Produk Profesional</h4>
                        <img src={result} onClick={() => setModalImageUrl(result)} alt="Hasil Foto Produk" className="w-full aspect-square object-contain rounded-md cursor-pointer bg-surface" />
                    </div>
                    <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="secondary">Simpan ke Lemari</Button>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Foto Produk" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default PhotoStudio;