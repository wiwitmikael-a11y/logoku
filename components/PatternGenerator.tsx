// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generatePattern, applyPatternToMockup } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
// FIX: Module '"../services/supabaseClient"' has no exported member 'supabase'. Did you mean 'getSupabaseClient'?
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const PATTERN_COST = 2;
const MOCKUP_COST = 1;
const XP_REWARD = 25;

const MOCKUP_ASSETS = {
    mug: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_mug_white.png',
    bag: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_bag_white.png',
    shirt: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_shirt_white.png',
};

interface PatternGeneratorProps {
    selectedProjectContext: Project | null;
}

const PatternGenerator: React.FC<PatternGeneratorProps> = ({ selectedProjectContext }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [mockupPreviews, setMockupPreviews] = useState<{mug?: string; bag?: string; shirt?: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingMockup, setLoadingMockup] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
        
    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Deskripsi pola tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < PATTERN_COST) { setShowOutOfCreditsModal(true); return; }

        let finalPrompt = prompt;
        if (selectedProjectContext?.project_data.selectedPersona) {
            const persona = selectedProjectContext.project_data.selectedPersona;
            finalPrompt += `. Gunakan palet warna utama: ${persona.palet_warna_hex.join(', ')} dengan gaya ${persona.kata_kunci.join(', ')}.`;
        }

        setIsLoading(true); setError(null); setResult(null); setMockupPreviews({}); playSound('start');
        try {
            if (!(await deductCredits(PATTERN_COST))) throw new Error("Gagal mengurangi token.");
            
            const [patternUrl] = await generatePattern(finalPrompt);
            setResult(patternUrl);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat pola.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateMockup = async (type: 'mug' | 'bag' | 'shirt') => {
        if (!result || loadingMockup) return;
        if ((profile?.credits ?? 0) < MOCKUP_COST) { setShowOutOfCreditsModal(true); return; }

        setLoadingMockup(type); setError(null);
        try {
            if (!(await deductCredits(MOCKUP_COST))) throw new Error("Gagal mengurangi token.");
            const mockupUrl = await applyPatternToMockup(result, MOCKUP_ASSETS[type]);
            setMockupPreviews(prev => ({ ...prev, [type]: mockupUrl }));
        } catch (err) {
            setError(err instanceof Error ? `Gagal membuat mockup ${type}: ${err.message}` : 'Gagal membuat mockup.');
        } finally {
            setLoadingMockup(null);
        }
    };

    const handleSaveToLemari = async () => {
        if (!user || !result || isSaving) return;
        setIsSaving(true);
        // FIX: 'supabase' is not defined.
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('lemari_kreasi').insert({
            user_id: user.id,
            asset_type: 'pattern',
            name: `Pola: ${prompt.substring(0, 40)}`,
            asset_data: { url: result, prompt },
        });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); }
        else { playSound('success'); alert('Pola berhasil disimpan ke Lemari Kreasi!'); }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Studio Motif Brand</h3>
            <p className="text-sm text-text-body">Butuh motif unik buat kemasan, background, atau merchandise? Masukkan idemu, dan Mang AI akan membuatkan pola seamless (tanpa sambungan) yang bisa langsung dicoba di berbagai mockup.</p>

            <div className="space-y-2">
                <Textarea label="Deskripsi Pola" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: batik megamendung modern, warna pastel" rows={3} />
                 {selectedProjectContext && (
                    <p className="text-xs text-primary animate-content-fade-in">✨ Prompt akan disempurnakan dengan palet warna & gaya dari brand "{selectedProjectContext.project_data.brandInputs?.businessName}".</p>
                )}
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                Buat Motif! ({PATTERN_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}

            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {result && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Pola Hasil Generate</h4>
                        <div onClick={() => setModalImageUrl(result)} className="w-full h-48 rounded-md cursor-pointer border-2 border-surface" style={{backgroundImage: `url(${result})`, backgroundSize: '100px 100px'}} />
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Pratinjau di Mockup</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {['mug', 'bag', 'shirt'].map(type => (
                                <div key={type} className="text-center">
                                    {mockupPreviews[type as keyof typeof mockupPreviews] ? (
                                        <img src={mockupPreviews[type as keyof typeof mockupPreviews]} onClick={() => setModalImageUrl(mockupPreviews[type as keyof typeof mockupPreviews]!)} alt={`${type} mockup`} className="w-full aspect-square object-cover rounded-md cursor-pointer" />
                                    ) : (
                                        <div className="w-full aspect-square bg-border-light rounded-md flex items-center justify-center">
                                            {loadingMockup === type ? <LoadingMessage/> : <Button size="small" variant="secondary" onClick={() => handleGenerateMockup(type as any)}>Coba di {type} ({MOCKUP_COST}T)</Button>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleSaveToLemari} isLoading={isSaving} variant="secondary">Simpan Pola ke Lemari</Button>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Pola" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default PatternGenerator;
