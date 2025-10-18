// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { useAuth } from '../contexts/AuthContext';
import { generateBrandPersona } from '../services/geminiService';
import type { BrandInputs, BrandPersona, Project, ProjectData } from '../types';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const PERSONA_COST = 5;
const XP_REWARD = 100;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();
    
    const [brandInputs, setBrandInputs] = useState<BrandInputs>(
        project.project_data.brandInputs || {
            businessName: project.project_name,
            industry: '',
            targetAudience: '',
            valueProposition: '',
            competitorAnalysis: '',
            businessDetail: '',
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (lastVoiceConsultationResult) {
            setBrandInputs(prev => ({ ...prev, ...lastVoiceConsultationResult }));
            setLastVoiceConsultationResult(null); 
        }
    }, [lastVoiceConsultationResult, setLastVoiceConsultationResult]);
    
    useEffect(() => {
        setBrandInputs(project.project_data.brandInputs || {
            businessName: project.project_name,
            industry: '',
            targetAudience: '',
            valueProposition: '',
            competitorAnalysis: null,
            businessDetail: null,
        });
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBrandInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async () => {
        const { businessName, industry, targetAudience, valueProposition, competitorAnalysis } = brandInputs;
        if (!businessName || !industry || !targetAudience || !valueProposition) {
            setError('Nama Bisnis, Industri, Target Audiens, dan Keunggulan wajib diisi.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!(await deductCredits(PERSONA_COST))) return;
            
            const personas = await generateBrandPersona(businessName, industry, targetAudience, valueProposition, competitorAnalysis);
            await onUpdateProject({ brandInputs, brandPersonas: personas });
            await addXp(XP_REWARD);
            playSound('success');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat persona.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
             <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
                <div>
                    <h4 className="font-bold text-text-header">Tips dari Mang AI!</h4>
                    <p className="text-sm text-text-body mt-1">Isi data ini selengkap mungkin ya, Juragan. Makin detail informasinya, makin jago juga saya bikinin persona brand yang pas buat bisnis lo!</p>
                </div>
            </div>

            <div className="p-6 bg-surface rounded-lg">
                <h3 className="font-bold text-text-header mb-4 text-lg">1. Detail Brand Anda</h3>
                <div className="space-y-4">
                    <Input 
                        label="Nama Bisnis / Brand" 
                        name="businessName" 
                        value={brandInputs.businessName || ''}
                        onChange={handleChange}
                        placeholder="Contoh: Kopi Senja"
                    />
                    <Input 
                        label="Industri / Bidang Usaha" 
                        name="industry" 
                        value={brandInputs.industry || ''}
                        onChange={handleChange}
                        placeholder="Contoh: Kedai Kopi, Fashion, Jasa Digital"
                    />
                    <Textarea 
                        label="Target Audiens" 
                        name="targetAudience"
                        value={brandInputs.targetAudience || ''}
                        onChange={handleChange}
                        placeholder="Contoh: Mahasiswa dan pekerja kantoran, usia 18-30 tahun, suka tempat nongkrong yang nyaman"
                        rows={3}
                    />
                    <Textarea 
                        label="Keunggulan / Value Proposition" 
                        name="valueProposition" 
                        value={brandInputs.valueProposition || ''}
                        onChange={handleChange}
                        placeholder="Contoh: Biji kopi asli Indonesia, harga terjangkau, suasana yang homey"
                        rows={3}
                    />
                    {error && <ErrorMessage message={error}/>}

                    <Button onClick={handleGenerate} isLoading={isLoading} className="w-full !mt-6" variant="primary">
                        Gas, Buat Persona Keren! ({PERSONA_COST} Token, +{XP_REWARD} XP)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BrandPersonaGenerator;