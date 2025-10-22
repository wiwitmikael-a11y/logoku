// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generatePattern, applyPatternToMockup } from '../services/geminiService';
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

const PATTERN_COST = 2;
const MOCKUP_COST = 1;
const XP_REWARD = 25;

const MOCKUP_ASSETS = {
    mug: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_mug_white.png',
    bag: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_bag_white.png',
    shirt: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/mockup_shirt_white.png',
};

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const PatternGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('Geometric');
    const [result, setResult] = useState<string | null>(null);
    const [mockupPreviews, setMockupPreviews] = useState<{mug?: string; bag?: string; shirt?: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingMockup, setLoadingMockup] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    useEffect(() => {
        setPrompt(''); setResult(null); setMockupPreviews({}); setError(null);
    }, [project]);
        
    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Deskripsi pola tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < PATTERN_COST) { setShowOutOfCreditsModal(true); return; }

        const fullPrompt = `${style}, ${prompt}`;

        setIsLoading(true); setError(null); setResult(null); setMockupPreviews({}); playSound('start');
        try {
            if (!(await deductCredits(PATTERN_COST))) throw new Error("Gagal mengurangi token.");
            const [patternUrl] = await generatePattern(fullPrompt, project.project_data.selectedPersona);
            setResult(patternUrl);
            await handleSaveToProject(patternUrl, prompt);
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

    const handleSaveToProject = async (url: string, originalPrompt: string) => {
        if (!project || !url || isSaving) return;
        setIsSaving(true);
        const currentPatterns = project.project_data.sotoshop_assets?.patterns || [];
        const newPatterns = [...currentPatterns, { url, prompt: originalPrompt }];
        try {
           await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, patterns: newPatterns } });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CollapsibleSection title="Studio Motif Brand" icon="✨" initialOpen={false}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Butuh motif unik buat kemasan, background, atau merchandise? Masukkan idemu, dan Mang AI akan membuatkan pola seamless (tanpa sambungan) yang bisa langsung dicoba di berbagai mockup.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Select 
                        label="Gaya Pola"
                        name="style"
                        value={style}
                        onChange={e => setStyle(e.target.value)}
                        options={[
                            { value: 'Geometric', label: 'Geometris' },
                            { value: 'Floral', label: 'Bunga / Floral' },
                            { value: 'Abstract', label: 'Abstrak' },
                            { value: 'Kids', label: 'Anak-anak' },
                            { value: 'Batik', label: 'Batik Modern' },
                        ]}
                    />
                    <Textarea label="Deskripsi Detail" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: daun tropis, monokrom" rows={1} />
                </div>

                <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                    Buat Motif! ({PATTERN_COST} Token, +{XP_REWARD} XP)
                </Button>
                
                {error && <ErrorMessage message={error} />}
                {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

                {result && (
                    <div className="space-y-4 animate-content-fade-in mt-4">
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Pola Hasil Generate</h4>
                             <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                            <div onClick={() => setModalImageUrl(result)} className="w-full h-48 rounded-md cursor-pointer border-2 border-surface" style={{backgroundImage: `url(${result})`, backgroundSize: '100px 100px'}} />
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg border border-border-main">
                            <h4 className="font-bold text-text-header mb-2">Pratinjau di Mockup</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {['mug', 'bag', 'shirt'].map(type => (
                                    <div key={type} className="text-center">
                                        {mockupPreviews[type as keyof typeof mockupPreviews] ? (
                                            <img src={mockupPreviews[type as keyof typeof mockupPreviews]!} onClick={() => setModalImageUrl(mockupPreviews[type as keyof typeof mockupPreviews]!)} alt={`${type} mockup`} className="w-full aspect-square object-cover rounded-md cursor-pointer" />
                                        ) : (
                                            <div className="w-full aspect-square bg-border-light/20 rounded-md flex items-center justify-center">
                                                {loadingMockup === type ? <LoadingMessage/> : <Button size="small" variant="secondary" onClick={() => handleGenerateMockup(type as any)}>Coba di {type} ({MOCKUP_COST}T)</Button>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Pola" onClose={() => setModalImageUrl(null)} />}
            </div>
        </CollapsibleSection>
    );
};

export default PatternGenerator;