// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateBrandPersonas, generateSlogans } from '../services/geminiService';
import type { BrandInputs, BrandPersona, Project, ProjectData } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';

const PERSONA_COST = 5;
const SLOGAN_COST = 2;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
  const [inputs, setInputs] = useState<BrandInputs>(project.project_data.brandInputs || { businessName: '', businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' });
  const [personas, setPersonas] = useState<BrandPersona[]>(project.project_data.brandPersonas || []);
  const [selectedPersona, setSelectedPersona] = useState<BrandPersona | null>(project.project_data.selectedPersona || null);
  const [slogans, setSlogans] = useState<string[]>(project.project_data.slogans || []);
  const [isLoading, setIsLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePersonas = async () => {
    if (!inputs.businessName || !inputs.businessDetail) { setError("Nama dan detail bisnis wajib diisi!"); return; }
    if ((project.user_id && (await deductCredits(PERSONA_COST)) === false)) return;
    setIsLoading('persona'); setError(null); playSound('start');
    try {
      const generatedPersonas = await generateBrandPersonas(inputs);
      setPersonas(generatedPersonas);
      await onUpdateProject({ brandInputs: inputs, brandPersonas: generatedPersonas, selectedPersona: null });
      playSound('success');
    } catch (err) {
      setError((err as Error).message);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (persona: BrandPersona) => {
    setSelectedPersona(persona);
    onUpdateProject({ selectedPersona: persona });
    playSound('select');
  };

  const handleGenerateSlogans = async () => {
    if ((project.user_id && (await deductCredits(SLOGAN_COST)) === false)) return;
    setIsLoading('slogan'); setError(null);
    try {
        const newSlogans = await generateSlogans(inputs);
        setSlogans(newSlogans);
        await onUpdateProject({ slogans: newSlogans, selectedSlogan: null });
        await addXp(XP_REWARD);
    } catch(err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectSlogan = (slogan: string) => {
    onUpdateProject({ selectedSlogan: slogan });
    playSound('select');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4 p-4 bg-surface rounded-2xl">
          <h3 className="text-xl font-bold text-text-header">1. Detail Brand Anda</h3>
          <Input label="Nama Bisnis / Brand" name="businessName" value={inputs.businessName} onChange={handleInputChange} />
          <Textarea label="Jelaskan Bisnismu" name="businessDetail" value={inputs.businessDetail} onChange={handleInputChange} rows={3} />
          <Input label="Industri / Bidang Usaha" name="industry" value={inputs.industry} onChange={handleInputChange} />
          <Textarea label="Siapa Target Pasarmu?" name="targetAudience" value={inputs.targetAudience} onChange={handleInputChange} rows={2} />
          <Textarea label="Apa Keunggulan Utamamu?" name="valueProposition" value={inputs.valueProposition} onChange={handleInputChange} rows={2} />
          <Button onClick={handleGeneratePersonas} isLoading={isLoading === 'persona'} disabled={!!isLoading} className="w-full">
            Buat Persona Brand ({PERSONA_COST} Token)
          </Button>
        </div>
        
        {/* Persona & Slogan Section */}
        <div className="space-y-4 p-4 bg-surface rounded-2xl">
          <h3 className="text-xl font-bold text-text-header">2. Pilih Persona & Slogan</h3>
          {error && <ErrorMessage message={error} />}
          {isLoading === 'persona' && <div className="flex justify-center p-4"><LoadingMessage/></div>}
          
          {personas.length > 0 && (
            <div className="space-y-4 animate-content-fade-in">
              <h4 className="font-semibold text-text-muted">Pilih 1 Persona:</h4>
              <div className="grid grid-cols-1 gap-3">
                {personas.map((p, i) => (
                  <div key={i} onClick={() => handleSelectPersona(p)} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedPersona?.nama_persona === p.nama_persona ? 'selection-card-active' : 'selection-card'}`}>
                    <h5 className="font-bold text-primary">{p.nama_persona}</h5>
                    <p className="text-xs text-text-body mt-1">{p.deskripsi}</p>
                    <div className="flex gap-2 mt-2">
                        {p.palet_warna.map(c => <div key={c.hex} className="w-4 h-4 rounded-full border border-surface" style={{backgroundColor: c.hex}} title={c.nama}/>)}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedPersona && (
                <div className="pt-4 border-t border-border-main">
                  <Button onClick={handleGenerateSlogans} isLoading={isLoading === 'slogan'} disabled={!!isLoading} size="small" variant="secondary">
                    Buat Slogan ({SLOGAN_COST} Token, +{XP_REWARD} XP)
                  </Button>
                  {isLoading === 'slogan' && <div className="flex justify-center p-2"><LoadingMessage/></div>}
                  {slogans.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {slogans.map(slogan => (
                        <div key={slogan} onClick={() => handleSelectSlogan(slogan)} className={`p-2 rounded-md text-sm cursor-pointer ${project.project_data.selectedSlogan === slogan ? 'bg-primary/20 text-primary-hover font-semibold' : 'bg-background hover:bg-border-light'}`}>
                          "{slogan}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandPersonaGenerator;
