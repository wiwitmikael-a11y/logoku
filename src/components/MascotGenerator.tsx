// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateMascot, enhancePromptWithPersonaStyle } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

const MASCOT_COST = 3;
const XP_REWARD = 50;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const MascotGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    
    useEffect(() => {
        // Reset local state when the project prop changes
        setPrompt('');
        setResults([]);
        setError(null);
    }, [project]);

    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Deskripsi maskot tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < MASCOT_COST) { setShowOutOfCreditsModal(true); return; }

        const finalPrompt = enhancePromptWithPersonaStyle(prompt, project.project_data.selectedPersona || null);

        setIsLoading(true); setError(null); setResults([]); playSound('start');
        try {
            if (!(await deductCredits(MASCOT_COST))) throw new Error("Gagal mengurangi token.");
            
            const mascotUrls = await generateMascot(finalPrompt);
            setResults(mascotUrls);
            await handleSaveToProject(mascotUrls);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat maskot.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async (urls: string[]) => {
        if (!project || urls.length === 0 || isSaving) return;
        
        setIsSaving(true);
        setError(null);
        
        const currentMascots = project.project_data.sotoshop_assets?.mascots || [];
        const newMascots = [...currentMascots, ...urls];
        
        try {
            await onUpdateProject({
                sotoshop_assets: {
                    ...project.project_data.sotoshop_assets,
                    mascots: newMascots
                }
            });
        } catch (err) {
            setError(`Gagal menyimpan otomatis: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Desainer Maskot</h3>
            <p className="text-sm text-text-body">Brand yang punya maskot itu lebih gampang diingat, lho! Coba deskripsikan maskot impianmu, dan Mang AI akan menggambarkannya untukmu.</p>

            <div className="space-y-2">
                <Textarea label="Deskripsi Maskot" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: seekor kapibara santai pakai kacamata hitam sambil minum kopi" rows={3} />
                {project && project.project_data.selectedPersona && (
                    <p className="text-xs text-primary animate-content-fade-in">✨ Gaya maskot akan disesuaikan dengan palet warna & gaya dari brand "{project.project_data.project_name}".</p>
                )}
            </div>

            <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt.trim()} variant="accent" className="w-full">
                Hidupkan Maskotnya! ({MASCOT_COST} Token, +{XP_REWARD} XP)
            </Button>
            
            {error && <ErrorMessage message={error} />}

            {isLoading && <div className="flex justify-center p-4"><LoadingMessage /></div>}

            {results.length > 0 && (
                <div className="space-y-4 animate-content-fade-in mt-4">
                    <div className="p-4 bg-background rounded-lg border border-border-main">
                        <h4 className="font-bold text-text-header mb-2">Pilihan Maskot</h4>
                        <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand proyek ini.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {results.map((img, i) => (
                                <img key={i} src={img} onClick={() => setModalImageUrl(img)} alt={`Mascot ${i+1}`} className="w-full aspect-square object-contain rounded-md cursor-pointer hover:scale-105 transition-transform" />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Maskot" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default MascotGenerator;