// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { useAuth } from '../contexts/AuthContext';
import { generateSlogans, generateLogoPrompts, generateLogoImage, generateLogoVariations } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import { compressAndConvertToWebP } from '../utils/imageUtils';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const SLOGAN_COST = 2;
const LOGO_PROMPT_COST = 1;
const LOGO_IMAGE_COST = 2;
const LOGO_VARIATION_COST = 4;
const XP_REWARD = 100;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const LogoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    
    const [isLoadingSlogans, setIsLoadingSlogans] = useState(false);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState<number | null>(null);
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { brandInputs, selectedPersona, slogans, selectedSlogan, logoPrompts, logoUrls, selectedLogoUrl, logoVariations } = project.project_data;

    const handleGenerateSlogans = async () => {
        if (!brandInputs || !selectedPersona) return;
        setIsLoadingSlogans(true); setError(null);
        try {
            if (!(await deductCredits(SLOGAN_COST))) return;
            const newSlogans = await generateSlogans(brandInputs, selectedPersona);
            await onUpdateProject({ slogans: newSlogans, selectedSlogan: newSlogans[0] });
            await addXp(XP_REWARD / 3);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat slogan.'); playSound('error'); } 
        finally { setIsLoadingSlogans(false); }
    };

    const handleGeneratePrompts = async () => {
        if (!brandInputs || !selectedPersona) return;
        setIsLoadingPrompts(true); setError(null);
        try {
            if (!(await deductCredits(LOGO_PROMPT_COST))) return;
            const newPrompts = await generateLogoPrompts(brandInputs, selectedPersona);
            await onUpdateProject({ logoPrompts: newPrompts });
            await addXp(XP_REWARD / 3);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat prompt logo.'); playSound('error'); }
        finally { setIsLoadingPrompts(false); }
    };
    
    const handleGenerateImage = async (prompt: string, index: number) => {
        setIsLoadingImage(index); setError(null);
        try {
            if (!(await deductCredits(LOGO_IMAGE_COST))) return;
            let generatedUrl = await generateLogoImage(prompt);
            generatedUrl = await compressAndConvertToWebP(generatedUrl); // Compress before saving
            
            const newLogoUrls = [...(logoUrls || [])];
            newLogoUrls[index] = generatedUrl;
            
            const updatePayload: Partial<ProjectData> = { logoUrls: newLogoUrls };
            if (!selectedLogoUrl) {
                updatePayload.selectedLogoUrl = generatedUrl; // Auto-select first generated logo
            }

            await onUpdateProject(updatePayload);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat gambar logo.'); playSound('error'); } 
        finally { setIsLoadingImage(null); }
    };
    
    const handleGenerateVariations = async () => {
        if (!selectedLogoUrl) return;
        setIsLoadingVariations(true); setError(null);
        try {
            if (!(await deductCredits(LOGO_VARIATION_COST))) return;
            const variations = await generateLogoVariations(selectedLogoUrl);
            const compressedVariations: { [key: string]: string } = {};
            for (const key in variations) {
                compressedVariations[key] = await compressAndConvertToWebP(variations[key]);
            }
            await onUpdateProject({ logoVariations: { ...logoVariations, ...compressedVariations } });
            await addXp(XP_REWARD / 2);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat variasi logo.'); playSound('error'); }
        finally { setIsLoadingVariations(false); }
    };


    if (!selectedPersona) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                 <span className="text-5xl mb-4">👤</span>
                 <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona Dulu, Juragan!</h2>
                 <p className="mt-2 text-text-muted max-w-md">Logo yang bagus itu cerminan dari brand. Mang AI butuh persona brand buat nentuin gaya desain yang pas. Silakan lengkapi langkah pertama di tab "Persona".</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
                <div>
                    <h4 className="font-bold text-text-header">Saatnya Bikin Muka Brand!</h4>
                    <p className="text-sm text-text-body mt-1">Logo itu identitas utama. Kita mulai dari slogan, lanjut ke ide konsep (prompt), baru deh kita cetak logonya. Santai, ikuti aja langkahnya satu-satu ya!</p>
                </div>
            </div>

            {error && <ErrorMessage message={error}/>}

            {/* Step 1: Slogan */}
            <div className="p-6 bg-surface rounded-lg">
                <h3 className="font-bold text-text-header mb-1 text-lg">2.1. Tentukan Slogan Juara</h3>
                <p className="text-sm text-text-muted mb-4">Slogan yang nendang bantu AI mikirin visual yang pas.</p>
                {slogans && slogans.length > 0 ? (
                    <div className="space-y-2">
                        {slogans.map((slogan, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedSlogan === slogan ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-background'}`} onClick={() => onUpdateProject({ selectedSlogan: slogan })}>
                                <input type="radio" name="slogan" checked={selectedSlogan === slogan} readOnly className="form-radio text-primary focus:ring-primary" />
                                <label className="text-text-body">{slogan}</label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Button onClick={handleGenerateSlogans} isLoading={isLoadingSlogans} className="w-full">
                        Buat Pilihan Slogan ({SLOGAN_COST} Token)
                    </Button>
                )}
            </div>
            
            {/* Step 2: Logo Prompts */}
            {selectedSlogan && (
                 <div className="p-6 bg-surface rounded-lg animate-content-fade-in">
                    <h3 className="font-bold text-text-header mb-1 text-lg">2.2. Pilih Konsep Desain</h3>
                    <p className="text-sm text-text-muted mb-4">Pilih arahan visual buat Mang AI.</p>
                    {logoPrompts && logoPrompts.length > 0 ? (
                         <div className="space-y-3">
                            {logoPrompts.map((prompt, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 bg-background rounded-lg">
                                    <div className="flex-grow">
                                        <p className="text-sm text-text-body">{prompt}</p>
                                    </div>
                                    <Button onClick={() => handleGenerateImage(prompt, i)} isLoading={isLoadingImage === i} size="small" variant="accent">
                                        Buat Logo Ini! ({LOGO_IMAGE_COST}T)
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Button onClick={handleGeneratePrompts} isLoading={isLoadingPrompts} className="w-full">
                           Kasih Ide Konsep Logo ({LOGO_PROMPT_COST} Token)
                        </Button>
                    )}
                 </div>
            )}
            
            {/* Step 3: Logo Results */}
            {logoUrls && logoUrls.length > 0 && (
                <div className="p-6 bg-surface rounded-lg animate-content-fade-in">
                    <h3 className="font-bold text-text-header mb-1 text-lg">2.3. Pilih & Sempurnakan Logo</h3>
                    <p className="text-sm text-text-muted mb-4">Klik logo favoritmu untuk menjadikannya logo utama.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {logoUrls.map((url, i) => url && (
                             <div key={i} className={`p-2 bg-background rounded-lg cursor-pointer ${selectedLogoUrl === url ? 'ring-4 ring-primary' : 'hover:ring-2 ring-primary'}`} onClick={() => onUpdateProject({ selectedLogoUrl: url })}>
                                 <img src={url} alt={`Logo option ${i+1}`} className="w-full aspect-square object-contain" />
                             </div>
                        ))}
                    </div>
                    {selectedLogoUrl && (
                        <div className="mt-6 border-t border-border-main pt-4">
                            <h4 className="font-semibold text-text-header mb-2">Variasi Logo Utama</h4>
                            {logoVariations ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                   {Object.entries(logoVariations).map(([key, url]) => url && (
                                       <div key={key} className="text-center">
                                            <div className="p-2 bg-background rounded-lg">
                                                <img src={url} alt={`${key} variation`} className="w-full aspect-square object-contain"/>
                                            </div>
                                            <p className="text-xs mt-1 text-text-muted capitalize">{key}</p>
                                       </div>
                                   ))}
                                </div>
                            ) : (
                                <Button onClick={handleGenerateVariations} isLoading={isLoadingVariations} variant="secondary">
                                    Buat Variasi (Stacked, Horizontal, dll.) ({LOGO_VARIATION_COST} Token)
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogoGenerator;
