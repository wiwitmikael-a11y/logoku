// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
// FIX: Corrected import path. Assumes geminiService.ts exists and exports these functions.
import { generateMoodboardText, generateMoodboardImages } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';
import CollapsibleSection from './common/CollapsibleSection';

const MOODBOARD_COST = 3;
const XP_REWARD = 25;

const VIBE_SUGGESTIONS = ["Kopi senja, hangat, rustic", "Modern, bersih, teknologi", "Ceria, anak-anak, playful", "Mewah, elegan, emas", "Petualangan, alam, outdoor"];

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const MoodboardGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();

    const [keywords, setKeywords] = useState('');
    const [result, setResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    
    useEffect(() => {
        setKeywords(''); setResult(null); setError(null);
    }, [project]);
    
    const handleGenerate = async () => {
        if (!keywords.trim()) { setError('Kata kunci tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < MOODBOARD_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setResult(null); playSound('start');
        try {
            if (!(await deductCredits(MOODBOARD_COST))) throw new Error("Gagal mengurangi token.");
            
            const [textData, images] = await Promise.all([
                generateMoodboardText(keywords),
                generateMoodboardImages(keywords, project.project_data.selectedPersona)
            ]);
            
            const fullResult = { ...textData, images };
            setResult(fullResult);
            await handleSaveToProject(fullResult);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat moodboard.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToProject = async (moodboardData: {description: string; palette: string[]; images: string[]}) => {
        if (!project || isSaving) return;
        setIsSaving(true);
        const currentMoodboards = project.project_data.sotoshop_assets?.moodboards || [];
        const newMoodboards = [...currentMoodboards, moodboardData];

        try {
            await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, moodboards: newMoodboards } });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CollapsibleSection title="Asisten Vibe Brand" icon="🎨" initialOpen={false}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Bingung nentuin nuansa visual brand? Cukup kasih beberapa kata kunci, dan Mang AI akan meracik sebuah moodboard lengkap dengan deskripsi, palet warna, dan gambar inspirasi.</p>

                <div className="space-y-2">
                    <Textarea label="Masukkan Kata Kunci / Vibe" name="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Contoh: Kopi senja, hangat, rustic" rows={2} />
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-text-muted my-auto">Saran:</span>
                        {VIBE_SUGGESTIONS.map(s => <button key={s} onClick={() => setKeywords(s)} className="text-xs bg-background/50 text-text-body px-2 py-1 rounded-md hover:bg-border-light">{s}</button>)}
                    </div>
                </div>

                <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !keywords.trim()} variant="accent" className="w-full">
                    Racik Vibe Brand! ({MOODBOARD_COST} Token, +{XP_REWARD} XP)
                </Button>
                
                {error && <ErrorMessage message={error} />}
                {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

                {result && (
                    <div className="space-y-4 animate-content-fade-in mt-4">
                         <p className="text-xs text-center text-green-400">✓ Moodboard otomatis tersimpan di Lemari Brand proyek ini.</p>
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Deskripsi Vibe</h4>
                            <p className="text-sm text-text-body italic selectable-text">"{result.description}"</p>
                        </div>
                         <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Palet Warna</h4>
                            <div className="flex items-center gap-2">
                                {result.palette.map(hex => <div key={hex} className="w-10 h-10 rounded-full border-2 border-surface" style={{backgroundColor: hex}} title={hex}/>)}
                                <CopyButton textToCopy={result.palette.join(', ')} />
                            </div>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Gambar Inspirasi</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {result.images.map((img, i) => (
                                    <img key={i} src={img} onClick={() => setModalImageUrl(img)} alt={`Inspirasi ${i+1}`} className="w-full aspect-square object-cover rounded-md cursor-pointer hover:scale-105 transition-transform" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Gambar Inspirasi" onClose={() => setModalImageUrl(null)} />}
            </div>
        </CollapsibleSection>
    );
};

export default MoodboardGenerator;
