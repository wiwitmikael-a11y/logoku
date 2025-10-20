// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateBrandPersonas } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData, BrandInputs, BrandPersona } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import VoiceBrandingWizard from './VoiceBrandingWizard';

const PERSONA_COST = 5;
const XP_REWARD_PERSONA = 100;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
    // FIX: Added onCreateProject prop to be passed down to the VoiceBrandingWizard.
    onCreateProject: (projectName: string, initialData: BrandInputs | null) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject, onCreateProject }) => {
    const { deductCredits, addXp } = useUserActions();
    const [inputs, setInputs] = useState<BrandInputs>({
        businessName: project.project_data.brandInputs?.businessName || project.project_data.project_name || '',
        businessDetail: project.project_data.brandInputs?.businessDetail || '',
        industry: project.project_data.brandInputs?.industry || '',
        targetAudience: project.project_data.brandInputs?.targetAudience || '',
        valueProposition: project.project_data.brandInputs?.valueProposition || '',
        competitorAnalysis: project.project_data.brandInputs?.competitorAnalysis || '',
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);

    const { brandPersonas, selectedPersona } = project.project_data;

    useEffect(() => {
        // Sync inputs if project changes
        setInputs({
            businessName: project.project_data.brandInputs?.businessName || project.project_data.project_name || '',
            businessDetail: project.project_data.brandInputs?.businessDetail || '',
            industry: project.project_data.brandInputs?.industry || '',
            targetAudience: project.project_data.brandInputs?.targetAudience || '',
            valueProposition: project.project_data.brandInputs?.valueProposition || '',
            competitorAnalysis: project.project_data.brandInputs?.competitorAnalysis || '',
        });
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (!(await deductCredits(PERSONA_COST))) return;
            // First, save the inputs to the project
            await onUpdateProject({ brandInputs: inputs });
            const personas = await generateBrandPersonas(inputs);
            await onUpdateProject({ brandPersonas: personas });
            await addXp(XP_REWARD_PERSONA);
            playSound('success');
        } catch (err) {
            setError((err as Error).message);
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectPersona = async (persona: BrandPersona) => {
        playSound('select');
        await onUpdateProject({ selectedPersona: persona });
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="p-4 rounded-lg flex items-start gap-3 mang-ai-callout border border-border-main">
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-header">Langkah 1: Kenalan Dulu!</h4>
                            <p className="text-xs text-text-body mt-1">Ceritain bisnismu. Makin detail, makin pas nanti persona brand-nya.</p>
                        </div>
                    </div>
                     <Button 
                        onClick={() => setShowVoiceWizard(true)}
                        variant="splash"
                        className="w-full"
                    >
                        🎤 Mesin Branding Ekspres (BETA)
                    </Button>
                </div>

                <form onSubmit={handleGenerate} className="md:col-span-2 space-y-4 p-4 bg-background rounded-lg">
                    <Input name="businessName" label="Nama Bisnis / Brand" value={inputs.businessName} onChange={handleChange} required />
                    <Textarea name="businessDetail" label="Jelasin bisnismu ngapain aja" value={inputs.businessDetail} onChange={handleChange} rows={3} required />
                    <Input name="industry" label="Industri (e.g., F&B, Fashion, Teknologi)" value={inputs.industry} onChange={handleChange} required />
                    <Input name="targetAudience" label="Target Pasar (e.g., Anak muda, Ibu rumah tangga)" value={inputs.targetAudience} onChange={handleChange} required />
                    <Textarea name="valueProposition" label="Apa yang bikin bisnismu beda & keren?" value={inputs.valueProposition} onChange={handleChange} rows={2} required />
                    <Input name="competitorAnalysis" label="Siapa aja kompetitor utamamu? (opsional)" value={inputs.competitorAnalysis} onChange={handleChange} />
                    <Button type="submit" isLoading={isLoading} className="w-full">
                        Buat 3 Opsi Persona Brand ({PERSONA_COST} Token)
                    </Button>
                </form>
            </div>

            {error && <ErrorMessage message={error} />}

            {brandPersonas && brandPersonas.length > 0 && (
                <div className="space-y-4 animate-content-fade-in">
                    <h3 className="text-xl font-bold text-text-header text-center">Pilih Persona yang Paling "Lo Banget"!</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {brandPersonas.map((p, i) => (
                            <div key={i} className={`p-4 rounded-lg border-2 transition-all duration-300 ${selectedPersona?.nama_persona === p.nama_persona ? 'border-primary bg-primary/5 scale-105' : 'bg-background border-transparent'}`}>
                                <h4 className="font-bold text-lg text-primary">{p.nama_persona}</h4>
                                <p className="text-xs text-text-muted mt-1 italic">"{p.deskripsi}"</p>
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-text-header mb-1">Palet Warna:</p>
                                    <div className="flex gap-1">
                                        {p.palet_warna.map(c => <div key={c.hex} className="w-5 h-5 rounded-full" style={{ backgroundColor: c.hex }} title={`${c.nama} (${c.hex})`}></div>)}
                                    </div>
                                </div>
                                <Button onClick={() => handleSelectPersona(p)} size="small" className="w-full mt-4">
                                    {selectedPersona?.nama_persona === p.nama_persona ? '✓ Terpilih' : 'Pilih Persona Ini'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <VoiceBrandingWizard 
                show={showVoiceWizard} 
                onClose={() => setShowVoiceWizard(false)}
                onCreateProject={onCreateProject}
            />
        </div>
    );
};

export default BrandPersonaGenerator;
