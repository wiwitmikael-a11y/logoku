// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateBrandPersonas } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, ProjectData, BrandInputs, BrandPersona } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import Input from './common/Input';
import Textarea from './common/Textarea';
import VoiceBrandingWizard from './VoiceBrandingWizard';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const PERSONA_COST = 5;
const XP_REWARD_PERSONA = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();

  const [brandInputs, setBrandInputs] = useState<BrandInputs>(
    project.project_data.brandInputs || {
      businessName: '',
      businessDetail: '',
      industry: '',
      targetAudience: '',
      valueProposition: '',
      competitorAnalysis: '',
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);

  // Check for results from voice consultation
  useEffect(() => {
    if (lastVoiceConsultationResult) {
      setBrandInputs(prev => ({ ...prev, ...lastVoiceConsultationResult }));
      // Clear it so it doesn't re-populate on re-renders
      setLastVoiceConsultationResult(null); 
    }
  }, [lastVoiceConsultationResult, setLastVoiceConsultationResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBrandInputs(prev => ({ ...prev, [name]: value }));
  };
  
  const isFormValid = () => {
    // Competitor analysis is optional
    const requiredInputs: (keyof BrandInputs)[] = ['businessName', 'businessDetail', 'industry', 'targetAudience', 'valueProposition'];
    return requiredInputs.every(key => brandInputs[key] && brandInputs[key].trim() !== '');
  };

  const handleGenerate = async () => {
    if (!isFormValid()) {
      setError('Harap isi semua kolom DNA Brand (kecuali kompetitor) sebelum melanjutkan.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!(await deductCredits(PERSONA_COST))) return;

      await onUpdateProject({ brandInputs });
      const personas = await generateBrandPersonas(brandInputs);
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

  const { brandPersonas, selectedPersona } = project.project_data;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{imageRendering: 'pixelated'}}/>
        <div>
          <h4 className="font-bold text-text-header">Yuk, Kenalan Sama Brand Juragan!</h4>
          <p className="text-sm text-text-body mt-1">Isi dulu 5 pilar DNA Brand di bawah ini. Semakin detail, semakin ciamik persona yang Mang AI bikinin. Atau, kalau mau lebih seru, coba deh <strong className="text-primary">Konsultasi Suara</strong>!</p>
        </div>
      </div>
      
      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nama Bisnis" name="businessName" value={brandInputs.businessName} onChange={handleInputChange} />
        <Input label="Industri / Bidang Usaha" name="industry" value={brandInputs.industry} onChange={handleInputChange} />
        <Textarea label="Detail Bisnis (Jual apa?)" name="businessDetail" value={brandInputs.businessDetail} onChange={handleInputChange} rows={3} />
        <Textarea label="Target Audiens" name="targetAudience" value={brandInputs.targetAudience} onChange={handleInputChange} rows={3} />
        <Textarea label="Keunggulan Utama" name="valueProposition" value={brandInputs.valueProposition} onChange={handleInputChange} rows={3} />
        <Textarea label="Analisis Kompetitor (Opsional)" name="competitorAnalysis" value={brandInputs.competitorAnalysis} onChange={handleInputChange} rows={3} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleGenerate} isLoading={isLoading} disabled={!isFormValid() || isLoading} className="w-full">
          Buat 3 Opsi Persona Brand ({PERSONA_COST} Token)
        </Button>
        <Button onClick={() => setShowVoiceWizard(true)} variant="accent" className="w-full">
          🎙️ Coba Konsultasi Suara
        </Button>
      </div>
      
      {error && <ErrorMessage message={error} />}

      {/* Persona Options */}
      {brandPersonas && brandPersonas.length > 0 && (
        <div className="space-y-4 animate-content-fade-in">
          <h3 className="text-xl font-bold text-text-header text-center">Pilih Persona yang Paling "Lo Banget"</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brandPersonas.map((p, i) => (
              <div key={i} className={`p-4 rounded-lg border-2 transition-all duration-300 ${selectedPersona?.nama_persona === p.nama_persona ? 'border-primary bg-primary/10 scale-105' : 'bg-background border-transparent hover:border-border-main'}`}>
                <h4 className="font-bold text-primary">{p.nama_persona}</h4>
                <p className="text-xs text-text-body mt-1 h-12 overflow-hidden">{p.deskripsi}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.palet_warna.map(c => <div key={c.hex} title={c.nama} className="w-5 h-5 rounded-full" style={{backgroundColor: c.hex}}></div>)}
                </div>
                <Button onClick={() => handleSelectPersona(p)} size="small" className="w-full mt-4" disabled={selectedPersona?.nama_persona === p.nama_persona}>
                  {selectedPersona?.nama_persona === p.nama_persona ? '✓ Terpilih' : 'Pilih Persona Ini'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
    </div>
  );
};

export default BrandPersonaGenerator;
