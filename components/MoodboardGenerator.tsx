// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateMoodboardText, generateMoodboardImages } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';

const MOODBOARD_COST = 3;
const XP_REWARD = 25;

const VIBE_SUGGESTIONS = ["Kopi senja, hangat, rustic", "Modern, bersih, teknologi", "Ceria, anak-anak, playful", "Mewah, elegan, emas", "Petualangan, alam, outdoor"];

const MoodboardGenerator: React.FC = () => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [keywords, setKeywords] = useState('');
    const [result, setResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    
    const handleGenerate = async () => {
        if (!keywords.trim()) { setError('Kata kunci tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < MOODBOARD_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(MOODBOARD_COST))) throw new Error("Gagal mengurangi token.");
            
            const [textData, images] = await Promise.all([
                generateMoodboardText(keywords),
                generateMoodboardImages(keywords)
            ]);
            
            setResult({ ...textData, images });
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat moodboard.');
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
            asset_type: 'moodboard',
            name: `Vibe: ${keywords.substring(0, 40)}`,
            asset_data: result,
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Moodboard berhasil disimpan ke Lemari Kreasi!'); }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Asisten Vibe Brand</h3>
            <p className="text-sm text-text-body">Bingung nentuin nuansa visual brand? Cukup kasih beberapa kata kunci, dan Mang AI akan meracik sebuah moodboard lengkap dengan deskripsi, palet warna, dan gambar inspirasi.</p>

            <div className="space-y-2">
                <Textarea label="Masukkan Kata Kunci / Vibe" name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Contoh: Kopi senja, hangat, rustic" rows={2} />
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-text-muted my-auto">Saran:</span>
                    {VIBE_SUGGESTIONS.map(s => <button key={s} onClick={() => setKeywords(s)} className="text-xs bg-background text-text-body px-2 py-1 rounded-md hover:bg-border-light">{s}</button>)}
                </div>
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !keywords.trim()} variant="accent" className="w-full">
                Racik Vibe Brand! ({MOODBOARD_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}

            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Deskripsi Vibe</h4>
                        <p className="text-sm text-text-body italic selectable-text">"{result.description}"</p>
                    </div>
                     <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Palet Warna</h4>
                        <div className="flex items-center gap-2">
                            {result.palette.map(hex => <div key={hex} className="w-10 h-10 rounded-full border-2 border-surface" style={{backgroundColor: hex}} title={hex}/>)}
                            <CopyButton textToCopy={result.palette.join(', ')} />
                        </div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Gambar Inspirasi</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {result.images.map((img, i) => (
                                <img key={i} src={img} onClick={() => setModalImageUrl(img)} alt={`Inspirasi ${i+1}`} className="w-full aspect-square object-cover rounded-md cursor-pointer hover:scale-105 transition-transform" />
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="secondary">Simpan ke Lemari Kreasi</Button>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Gambar Inspirasi" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default MoodboardGenerator;