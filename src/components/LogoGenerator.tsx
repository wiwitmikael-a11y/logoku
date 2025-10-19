// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateSlogans, generateLogoPrompt, generateLogoOptions, editLogo } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import { playSound } from '../services/soundService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import Textarea from './common/Textarea';
import ImageModal from './common/ImageModal';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const SLOGAN_COST = 1;
const LOGO_COST = 5;
const REVISI_COST = 1;
const XP_REWARD_LOGO = 150;

type AspectRatio = '1:1' | '4:3' | '16:9';

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const LogoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    const { selectedPersona, slogans, selectedSlogan, logoPrompt, logoOptions, selectedLogoUrl } = project.project_data;

    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [revisionPrompt, setRevisionPrompt] = useState('');

    const setLoader = (key: string, value: boolean) => setIsLoading(prev => ({ ...prev, [key]: value }));

    const handleGenerateSlogans = async () => {
        setLoader('slogans', true); setError(null);
        try {
            if (!(await deductCredits(SLOGAN_COST))) return;
            const res = await generateSlogans(project.project_data.brandInputs!);
            await onUpdateProject({ slogans: res });
        } catch (e) { setError((e as Error).message); } finally { setLoader('slogans', false); }
    };

    const handleSelectSlogan = async (slogan: string) => {
        playSound('select');
        await onUpdateProject({ selectedSlogan: slogan });
        // Auto-generate prompt after slogan selection
        if (selectedPersona) {
            setLoader('prompt', true); setError(null);
            try {
                const res = await generateLogoPrompt(slogan, selectedPersona);
                await onUpdateProject({ logoPrompt: res });
            } catch (e) { setError((e as Error).message); } finally { setLoader('prompt', false); }
        }
    };
    
    const handleGenerateLogos = async () => {
        if (!logoPrompt) return;
        setLoader('logos', true); setError(null);
        try {
            if (!(await deductCredits(LOGO_COST))) return;
            const res = await generateLogoOptions(logoPrompt, aspectRatio);
            await onUpdateProject({ logoOptions: res });
            await addXp(XP_REWARD_LOGO);
        } catch (e) { setError((e as Error).message); } finally { setLoader('logos', false); }
    };

    const handleSelectLogo = async (url: string) => {
        playSound('success');
        await onUpdateProject({ selectedLogoUrl: url });
    };

    const handleRevision = async () => {
        if (!revisionPrompt.trim() || !selectedLogoUrl) return;
        setLoader('revision', true); setError(null);
        try {
            if (!(await deductCredits(REVISI_COST))) return;
            const base64Image = await fetchImageAsBase64(selectedLogoUrl);
            const revisedUrl = await editLogo(base64Image, revisionPrompt);
            await onUpdateProject({ selectedLogoUrl: revisedUrl });
            setRevisionPrompt('');
        } catch (e) { setError((e as Error).message); } finally { setLoader('revision', false); }
    };

    if (!selectedPersona) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl mb-4">👤</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona Dulu, Juragan!</h2>
                <p className="mt-2 text-text-muted max-w-md">Logo yang bagus itu mencerminkan kepribadian brand. Silakan selesaikan Langkah 1 di tab "Persona" untuk melanjutkan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Step 1: Slogan */}
            <div className="p-4 bg-background rounded-lg">
                <h3 className="font-bold text-text-header mb-2">Step 1: Slogan Juara</h3>
                {slogans && slogans.length > 0 ? (
                    <div className="space-y-2">
                        {slogans.map((s, i) => (
                            <button key={i} onClick={() => handleSelectSlogan(s)} className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedSlogan === s ? 'bg-primary text-white font-semibold' : 'bg-surface hover:bg-border-light'}`}>
                                "{s}"
                            </button>
                        ))}
                    </div>
                ) : (
                    <Button onClick={handleGenerateSlogans} isLoading={isLoading.slogans}>Buat Opsi Slogan ({SLOGAN_COST} Token)</Button>
                )}
            </div>

            {/* Step 2: Logo Prompt */}
            {selectedSlogan && (
                 <div className="p-4 bg-background rounded-lg animate-content-fade-in">
                    <h3 className="font-bold text-text-header mb-2">Step 2: Resep Rahasia Logo</h3>
                    <Textarea name="logoPrompt" label="Prompt untuk AI" value={logoPrompt || ''} onChange={(e) => onUpdateProject({ logoPrompt: e.target.value })} rows={4} disabled={isLoading.prompt} />
                    {isLoading.prompt && <p className="text-sm text-accent animate-pulse mt-2">Mang AI sedang meracik resep...</p>}
                </div>
            )}
            
            {/* Step 3: Logo Generation */}
            {logoPrompt && (
                <div className="p-4 bg-background rounded-lg animate-content-fade-in">
                    <h3 className="font-bold text-text-header mb-2">Step 3: Waktunya Bikin Logo!</h3>
                    <div className="flex items-center gap-4 mb-3">
                         <label className="text-sm font-medium text-text-muted">Aspek Rasio:</label>
                         {(['1:1', '4:3', '16:9'] as AspectRatio[]).map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1 text-xs rounded-full ${aspectRatio === ratio ? 'bg-primary text-white' : 'bg-surface hover:bg-border-light'}`}>
                                {ratio}
                            </button>
                         ))}
                    </div>
                    <Button onClick={handleGenerateLogos} isLoading={isLoading.logos} className="w-full">
                        Buat 4 Opsi Logo! ({LOGO_COST} Token)
                    </Button>
                </div>
            )}

            {logoOptions && logoOptions.length > 0 && (
                <div className="p-4 bg-background rounded-lg animate-content-fade-in">
                    <h3 className="font-bold text-text-header mb-2">Pilih Logo Andalanku</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {logoOptions.map((url, i) => (
                            <div key={i} className={`relative group border-2 rounded-lg transition-all ${selectedLogoUrl === url ? 'border-primary scale-105' : 'border-transparent'}`}>
                                <img src={url} alt={`Logo Option ${i}`} className="w-full aspect-square object-contain rounded-md bg-white p-1 cursor-pointer" onClick={() => setModalImageUrl(url)} />
                                <button onClick={() => handleSelectLogo(url)} className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 py-1 text-xs font-bold rounded-md transition-opacity ${selectedLogoUrl === url ? 'bg-primary text-white' : 'bg-surface text-text-header opacity-0 group-hover:opacity-100'}`}>
                                    {selectedLogoUrl === url ? '✓ Terpilih' : 'Pilih Ini'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Step 4: Revision Studio */}
            {selectedLogoUrl && (
                <div className="p-4 bg-background rounded-lg border-2 border-primary animate-content-fade-in">
                    <h3 className="font-bold text-primary mb-2">Studio Revisi Logo Terpilih</h3>
                     <div className="flex flex-col md:flex-row gap-4 items-start">
                        <img src={selectedLogoUrl} alt="Logo Terpilih" className="w-full md:w-1/3 aspect-square object-contain rounded-md bg-white p-1" />
                        <div className="w-full space-y-2">
                           <Textarea name="revisionPrompt" label="Instruksi Revisi" value={revisionPrompt} onChange={(e) => setRevisionPrompt(e.target.value)} rows={3} placeholder="Contoh: ganti warnanya jadi biru dongker, tambahkan api di sekelilingnya, hapus teksnya" />
                           <Button onClick={handleRevision} isLoading={isLoading.revision} disabled={!revisionPrompt.trim()} className="w-full" variant="accent">
                                Revisi Logo Ini! ({REVISI_COST} Token)
                           </Button>
                        </div>
                    </div>
                </div>
            )}

            {error && <ErrorMessage message={error} />}
            {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Logo" onClose={() => setModalImageUrl(null)} />}
        </div>
    );
};

export default LogoGenerator;
