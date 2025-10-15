// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateProductPhoto, removeBackground } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const BG_REMOVAL_COST = 1;
const SCENE_GEN_COST = 1;
const XP_REWARD = 25;

const SCENE_TEMPLATES = [
    { name: "Meja Kayu Rustic", prompt: "di atas meja kayu rustic dengan properti biji kopi dan daun kering di sekitarnya." },
    { name: "Studio Minimalis", prompt: "di dalam studio minimalis dengan latar belakang warna pastel dan ada bayangan estetik dari jendela." },
    { name: "Alam Terbuka", prompt: "di atas batu di tepi pantai dengan latar belakang ombak yang tenang saat senja." },
    { name: "Rak Toko Modern", prompt: "di sebuah rak toko modern yang terang dengan beberapa produk lain yang blur di latar belakang." },
];

const PhotoStudio: React.FC = () => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [scenePrompt, setScenePrompt] = useState(SCENE_TEMPLATES[0].prompt);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const handleFileChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return; }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setOriginalImage(e.target?.result as string);
            setEditedImage(null);
            setFinalImage(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBackground = async () => {
        if (!originalImage) return;
        if ((profile?.credits ?? 0) < BG_REMOVAL_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); playSound('start');
        try {
            if (!(await deductCredits(BG_REMOVAL_COST))) throw new Error("Gagal mengurangi token.");
            const result = await removeBackground(originalImage);
            setEditedImage(result);
            await addXp(10);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal hapus background.'); playSound('error'); }
        finally { setIsLoading(false); }
    };
    
    const handleGenerateScene = async () => {
        const imageToUse = editedImage || originalImage;
        if (!imageToUse || !scenePrompt) return;
        if ((profile?.credits ?? 0) < SCENE_GEN_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); playSound('start');
        try {
            if (!(await deductCredits(SCENE_GEN_COST))) throw new Error("Gagal mengurangi token.");
            const result = await generateProductPhoto(imageToUse, scenePrompt);
            setFinalImage(result);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat foto produk.'); playSound('error'); }
        finally { setIsLoading(false); }
    };

    const handleSaveToLemari = async () => {
        if (!user || !finalImage || isSaving) return;
        setIsSaving(true);
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'photo_studio',
            name: `Foto Produk: ${scenePrompt.substring(0, 30)}`,
            asset_data: { url: finalImage, original: originalImage },
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Foto produk berhasil disimpan ke Lemari Kreasi!'); }
    };
    
    const reset = () => { setOriginalImage(null); setEditedImage(null); setFinalImage(null); setError(null); };

    return (
        <div className="space-y-4">
            <p className="text-splash font-bold text-sm">STUDIO FOTO VIRTUAL:</p>
            <p className="text-white text-sm">Upload foto produkmu dengan background polos, lalu biarkan Mang AI menempatkannya di berbagai suasana profesional. Gak perlu sewa studio mahal!</p>
            
            {error && <ErrorMessage message={error} />}

            {!originalImage && (
                <div 
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                    className={`p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border-main'}`}
                >
                    <label htmlFor="product-upload" className="cursor-pointer">
                        <p className="text-2xl mb-2">📸</p>
                        <p className="font-semibold text-text-header">Upload Foto Produkmu</p>
                        <p className="text-xs text-text-muted mt-1">Seret & lepas gambar di sini, atau klik untuk memilih file.</p>
                    </label>
                    <input id="product-upload" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                </div>
            )}
            
            {originalImage && (
                <div className="space-y-4 animate-content-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-2 bg-black/20 rounded-lg border border-border-main text-center">
                            <h4 className="text-xs font-bold text-text-muted mb-2">1. FOTO ASLI</h4>
                            <img src={originalImage} alt="Original" className="w-full aspect-square object-contain rounded" />
                        </div>
                        <div className="p-2 bg-black/20 rounded-lg border border-border-main text-center">
                            <h4 className="text-xs font-bold text-text-muted mb-2">2. HAPUS BACKGROUND (OPSIONAL)</h4>
                            {isLoading && !editedImage ? <div className="aspect-square flex items-center justify-center"><LoadingMessage/></div> : editedImage ? (
                                <img src={editedImage} alt="BG Removed" className="w-full aspect-square object-contain rounded" />
                            ) : (
                                <div className="aspect-square flex flex-col items-center justify-center bg-background rounded p-4">
                                    <p className="text-sm text-text-body">Hapus background biar hasilnya lebih bagus.</p>
                                    <Button onClick={handleRemoveBackground} isLoading={isLoading} size="small" variant="secondary" className="mt-2">Hapus BG ({BG_REMOVAL_COST} Token)</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-black/20 rounded-lg border border-border-main space-y-3">
                        <h4 className="font-bold text-text-header">3. Pilih Suasana</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                           {SCENE_TEMPLATES.map(s => (
                               <button key={s.name} onClick={() => setScenePrompt(s.prompt)} className={`p-2 text-xs rounded-md text-left transition-colors ${scenePrompt === s.prompt ? 'bg-primary text-white font-semibold' : 'bg-surface hover:bg-border-light'}`}>{s.name}</button>
                           ))}
                        </div>
                        <Button onClick={handleGenerateScene} isLoading={isLoading} disabled={isLoading} variant="accent" className="w-full">
                            Generate Foto Produk! ({SCENE_GEN_COST} Token, +{XP_REWARD} XP)
                        </Button>
                    </div>

                    {isLoading && !finalImage && <div className="flex justify-center p-4"><LoadingMessage /></div>}

                    {finalImage && (
                        <div className="p-4 bg-black/20 rounded-lg border border-border-main space-y-3">
                            <h4 className="font-bold text-text-header">4. HASIL AKHIR</h4>
                            <img src={finalImage} onClick={() => setModalImageUrl(finalImage)} alt="Final Product" className="w-full aspect-square object-contain rounded cursor-pointer" />
                             <div className="flex gap-4">
                                <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="secondary">Simpan ke Lemari</Button>
                                <Button onClick={reset} variant="secondary">Buat Foto Baru</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Hasil Foto Produk" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default PhotoStudio;