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
import { useAuth } from '../contexts/AuthContext';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const PERSONA_COST = 5;
const XP_REWARD_PERSONA = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();
  const { profile } = useAuth();
  
  const [view, setView] = useState<'CHOICE' | 'MANUAL' | 'VOICE'>('CHOICE');
  // FIX: Added state to explicitly control the VoiceBrandingWizard modal.
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  
  // This state is now the single source of truth for the form.
  // Changes to it will be passed up to AICreator, which then triggers the autosave.
  const [brandInputs, setBrandInputs] = useState<BrandInputs>(
    project.project_data.brandInputs || {
      businessName: project.project_data.project_name || '',
      businessDetail: '',
      industry: '',
      targetAudience: '',
      valueProposition: '',
      competitorAnalysis: '',
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with project data when it changes externally
  useEffect(() => {
    setBrandInputs(project.project_data.brandInputs || {
      businessName: project.project_data.project_name || '',
      businessDetail: '', industry: '', targetAudience: '',
      valueProposition: '', competitorAnalysis: '',
    });
  }, [project.project_data.brandInputs, project.project_data.project_name]);
  
  // Check for results from voice consultation
  useEffect(() => {
    if (lastVoiceConsultationResult) {
      const updatedInputs = { ...brandInputs, ...lastVoiceConsultationResult };
      setBrandInputs(updatedInputs);
      onUpdateProject({ brandInputs: updatedInputs }); // Trigger autosave
      setLastVoiceConsultationResult(null); 
      setView('MANUAL'); // Show the populated form
    }
  }, [lastVoiceConsultationResult, setLastVoiceConsultationResult, onUpdateProject, brandInputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedInputs = { ...brandInputs, [name]: value };
    setBrandInputs(updatedInputs);
    // Propagate changes up immediately to trigger autosave hook in AICreator
    onUpdateProject({ brandInputs: updatedInputs });
  };
  
  const isFormValid = () => {
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
      
      // No need to call onUpdateProject here for brandInputs, autosave has handled it.
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

  // --- RENDER LOGIC ---

  if (view === 'CHOICE' && !brandPersonas?.length) {
    return (
        <div className="text-center max-w-2xl mx-auto">
            <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mx-auto mb-4" style={{imageRendering: 'pixelated'}}/>
            <h2 className="text-3xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Mulai Dari Mana, Juragan?</h2>
            <p className="text-text-body mt-2 mb-6">Pilih cara paling nyaman buat nentuin kepribadian brand lo. Ngobrol langsung sama Mang AI, atau isi form manual.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div onClick={() => setShowVoiceWizard(true)} className="w-full sm:w-1/2 p-6 rounded-lg text-center cursor-pointer selection-card">
                    <span className="text-5xl">🎙️</span>
                    <h3 className="font-bold text-lg mt-2 text-text-header">Konsultasi Suara</h3>
                    <p className="text-xs text-text-muted mt-1">Ngobrol interaktif sama Mang AI buat gali DNA brand-mu. (Direkomendasikan)</p>
                </div>
                <div onClick={() => setView('MANUAL')} className="w-full sm:w-1/2 p-6 rounded-lg text-center cursor-pointer selection-card">
                    <span className="text-5xl">✍️</span>
                    <h3 className="font-bold text-lg mt-2 text-text-header">Isi Form Manual</h3>
                    <p className="text-xs text-text-muted mt-1">Isi detail brand-mu sendiri lewat form yang udah disiapin.</p>
                </div>
            </div>
            <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{imageRendering: 'pixelated'}}/>
        <div>
          <h4 className="font-bold text-text-header">DNA Brand Juragan</h4>
          <p className="text-sm text-text-body mt-1">Ini adalah fondasi brand-mu. Semakin detail isinya, semakin akurat semua aset yang akan dibuat Mang AI nanti.</p>
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
          {brandPersonas && brandPersonas.length > 0 ? 'Buat Ulang Opsi Persona' : 'Buat 3 Opsi Persona Brand'} ({PERSONA_COST} Token)
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
    </div>
  );
};

export default BrandPersonaGenerator;