// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateLogoOptions } from '../services/geminiService';
import { Project, ProjectData } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const LOGO_COST = 4;
const XP_REWARD = 50;

type Step = 1 | 2 | 3 | 4; // 1: Konsep, 2: Gaya, 3: Warna, 4: Hasil

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const LOGO_STYLES = [
    { name: 'Minimalis', icon: '🎨', prompt: 'minimalist, flat icon, modern' },
    { name: 'Maskot', icon: '🐻', prompt: 'cute mascot, cartoon character, simple' },
    { name: 'Abstrak', icon: '✨', prompt: 'abstract shape, geometric, clean' },
    { name: 'Vintage', icon: '📜', prompt: 'vintage, retro, hand-drawn, classic' },
    { name: 'Futuristik', icon: '🤖', prompt: 'futuristic, tech, cyber, neon' },
    { name: 'Elegan', icon: '💎', prompt: 'elegant, luxurious, premium, simple' },
];

const COLOR_PALETTES = [
    { name: 'Api Semangat', colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'] },
    { name: 'Langit Senja', colors: ['#F3904F', '#3B4371', '#FFD166', '#06D6A0'] },
    { name: 'Hutan Tropis', colors: ['#2F5D62', '#5E8B7E', '#A7C4BC', '#DFEEEA'] },
    { name: 'Pastel Ceria', colors: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF'] },
    { name: 'Monokrom Modern', colors: ['#1A1A1A', '#4A4A4A', '#9B9B9B', '#F5F5F5'] },
    { name: 'Samudra Dalam', colors: ['#003B46', '#07575B', '#66A5AD', '#C4DFE6'] },
];

// Helper component for Wizard Steps
const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
    const steps = ['Konsep', 'Gaya', 'Warna'];
    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-6">
            {steps.map((label, index) => (
                <React.Fragment key={index}>
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= index + 1 ? 'bg-primary text-white' : 'bg-surface text-text-muted'}`}>
                            {index + 1}
                        </div>
                        <span className={`font-semibold hidden sm:inline ${currentStep >= index + 1 ? 'text-text-header' : 'text-text-muted'}`}>{label}</span>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-1 rounded ${currentStep > index + 1 ? 'bg-primary' : 'bg-border-main'}`} />}
                </React.Fragment>
            ))}
        </div>
    );
};

const LogoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp } = useUserActions();
    
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [logoPrompt, setLogoPrompt] = useState(project.project_data.logoPrompt || '');
    const [selectedStyle, setSelectedStyle] = useState<string | null>(project.project_data.logoStyle || null);
    const [selectedPaletteName, setSelectedPaletteName] = useState<string | null>(project.project_data.logoPaletteName || null);
    const [logoOptions, setLogoOptions] = useState<string[]>(project.project_data.logoOptions || []);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPersonaApplied, setIsPersonaApplied] = useState(false);

    const selectedPersona = project.project_data.selectedPersona;
    
    useEffect(() => {
        // Reset state when project changes
        setLogoPrompt(project.project_data.logoPrompt || '');
        setSelectedStyle(project.project_data.logoStyle || null);
        setSelectedPaletteName(project.project_data.logoPaletteName || null);
        setLogoOptions(project.project_data.logoOptions || []);
        setCurrentStep(project.project_data.logoOptions?.length > 0 ? 4 : 1);
        setError(null);
    }, [project]);
    
    // Automatically apply persona styles when component loads or project changes
    useEffect(() => {
        if (selectedPersona) {
            const personaStyle = LOGO_STYLES.find(s => selectedPersona.kata_kunci.some(k => s.name.toLowerCase().includes(k.toLowerCase())));
            if (personaStyle && !selectedStyle) { // Only apply if not already set
                setSelectedStyle(personaStyle.name);
            }
            if (!selectedPaletteName) { // Only apply if not already set
                 setSelectedPaletteName('Warna dari Persona');
            }
            setIsPersonaApplied(true);
        }
    }, [selectedPersona, selectedStyle, selectedPaletteName]);

    const handleGenerateLogos = async () => {
        if (!project || !logoPrompt.trim() || !selectedStyle || !selectedPaletteName) {
            setError('Semua langkah harus diisi sebelum membuat logo.');
            return;
        }
        if ((profile?.credits ?? 0) < LOGO_COST) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!(await deductCredits(LOGO_COST))) throw new Error("Gagal mengurangi token.");

            const stylePrompt = LOGO_STYLES.find(s => s.name === selectedStyle)?.prompt || selectedStyle;
            let paletteColors: string[];
            if (selectedPaletteName === 'Warna dari Persona' && selectedPersona) {
                paletteColors = selectedPersona.palet_warna_hex;
            } else {
                paletteColors = COLOR_PALETTES.find(p => p.name === selectedPaletteName)?.colors || [];
            }
            
            const generatedUrls = await generateLogoOptions(logoPrompt, stylePrompt, project.project_name, paletteColors);
            setLogoOptions(generatedUrls);
            setCurrentStep(4); // Move to results step
            await onUpdateProject({ logoPrompt, logoStyle: selectedStyle, logoPaletteName: selectedPaletteName, logoOptions: generatedUrls });
            await addXp(XP_REWARD);
            playSound('success');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat logo.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectLogo = async (url: string) => {
        await onUpdateProject({ selectedLogoUrl: url });
        playSound('select');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-content-fade-in">
                        <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                            <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
                            <div>
                                <h4 className="font-bold text-text-header">Tips dari Mang AI!</h4>
                                <p className="text-sm text-text-body mt-1">Pikirkan satu objek atau simbol utama yang paling mewakili brand-mu. Gak usah ribet, yang simpel justru seringkali paling nempel di ingatan orang!</p>
                            </div>
                        </div>
                        <Input label="Nama Brand" name="businessName" value={project.project_name || ''} disabled />
                        <Textarea label="Objek / Simbol Utama Logo" name="logoPrompt" value={logoPrompt} onChange={e => setLogoPrompt(e.target.value)} placeholder="Contoh: biji kopi, kepala singa, roket, buku terbuka" rows={3} />
                        <Button className="w-full" onClick={() => setCurrentStep(2)} disabled={!logoPrompt.trim()}>Lanjut Pilih Gaya</Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-content-fade-in">
                        <h3 className="text-lg font-bold text-text-header text-center">Pilih Gaya Visual</h3>
                        {isPersonaApplied && <p className="text-xs text-center text-primary -mt-3">✨ Mang AI udah siapin gaya dari personamu, tapi bebas diubah!</p>}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {LOGO_STYLES.map(style => (
                                <button key={style.name} onClick={() => setSelectedStyle(style.name)} className={`p-4 border-2 rounded-lg text-center selection-card ${selectedStyle === style.name ? 'selection-card-active' : ''}`}>
                                    <span className="text-4xl">{style.icon}</span>
                                    <p className="font-semibold mt-2 text-sm">{style.name}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                           <Button variant="secondary" onClick={() => setCurrentStep(1)}>Kembali</Button>
                           <Button className="flex-1" onClick={() => setCurrentStep(3)} disabled={!selectedStyle}>Lanjut Pilih Warna</Button>
                        </div>
                    </div>
                );
            case 3:
                const personaPalette = { name: 'Warna dari Persona', colors: selectedPersona?.palet_warna_hex || [] };
                return (
                    <div className="space-y-4 animate-content-fade-in">
                        <h3 className="text-lg font-bold text-text-header text-center">Pilih Palet Warna</h3>
                         {isPersonaApplied && <p className="text-xs text-center text-primary -mt-3">✨ Ini palet warna dari personamu, Juragan!</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedPersona && (
                                <button onClick={() => setSelectedPaletteName(personaPalette.name)} className={`p-4 border-2 rounded-lg selection-card ${selectedPaletteName === personaPalette.name ? 'selection-card-active' : ''}`}>
                                    <p className="font-semibold mb-2 text-sm text-left">{personaPalette.name}</p>
                                    <div className="flex gap-2">{personaPalette.colors.map(c => <div key={c} className="w-6 h-6 rounded-full" style={{backgroundColor: c}}/>)}</div>
                                </button>
                            )}
                            {COLOR_PALETTES.map(palette => (
                                <button key={palette.name} onClick={() => setSelectedPaletteName(palette.name)} className={`p-4 border-2 rounded-lg selection-card ${selectedPaletteName === palette.name ? 'selection-card-active' : ''}`}>
                                    <p className="font-semibold mb-2 text-sm text-left">{palette.name}</p>
                                    <div className="flex gap-2">{palette.colors.map(c => <div key={c} className="w-6 h-6 rounded-full" style={{backgroundColor: c}}/>)}</div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                           <Button variant="secondary" onClick={() => setCurrentStep(2)}>Kembali</Button>
                           <Button className="flex-1" variant="accent" onClick={handleGenerateLogos} isLoading={isLoading} disabled={!selectedPaletteName || isLoading}>Buat 4 Opsi Logo! ({LOGO_COST} Token)</Button>
                        </div>
                    </div>
                );
             case 4:
                return (
                     <div className="space-y-4 animate-content-fade-in">
                        <h3 className="text-lg font-bold text-text-header text-center">Pilih Logo Juara-mu!</h3>
                        <p className="text-sm text-center text-text-muted -mt-3">Klik logo favoritmu untuk menyimpannya ke proyek. Tenang, pilihan lain tetap tersimpan di sini.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {logoOptions.map((url, index) => (
                                <div key={index} onClick={() => handleSelectLogo(url)} className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 ${project.project_data.selectedLogoUrl === url ? 'border-primary ring-4 ring-primary/30' : 'border-border-main hover:border-primary'}`}>
                                    <img src={url} alt={`Logo Option ${index + 1}`} className="w-full aspect-square object-contain bg-surface rounded-md" />
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" onClick={() => { setCurrentStep(1); setLogoOptions([]); }}>Mulai dari Awal</Button>
                    </div>
                )
        }
    };

    return (
        <div className="p-4 bg-surface rounded-lg">
            {error && <ErrorMessage message={error} />}
            <StepIndicator currentStep={currentStep} />
            <div className="mt-6">
                {renderStepContent()}
            </div>
        </div>
    );
};

export default LogoGenerator;