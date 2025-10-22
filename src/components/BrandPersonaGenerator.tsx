// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for BrandPersonaGenerator.tsx
import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateBrandPersonas } from '../services/geminiService';
import type { Project, ProjectData, BrandPersona, BrandInputs } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const PERSONA_COST = 2;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
  onComplete: () => void;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject, onComplete }) => {
  const { deductCredits, addXp } = useUserActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<BrandInputs>(
    project.project_data.brandInputs || {
      businessName: '',
      businessDetail: '',
      industry: '',
      targetAudience: '',
      valueProposition: '',
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (Object.values(inputs).some(val => !val.trim())) {
      setError("Harap isi semua kolom untuk hasil terbaik!");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!(await deductCredits(PERSONA_COST))) return;
      
      await onUpdateProject({ brandInputs: inputs });
      const newPersonas = await generateBrandPersonas(inputs);
      await onUpdateProject({ personas: newPersonas });
      await addXp(XP_REWARD);
      playSound('success');
    } catch (err) {
      setError((err as Error).message);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (persona: BrandPersona) => {
    onUpdateProject({ selectedPersona: persona });
    playSound('select');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full"><span className="text-3xl">🧠</span></div>
        <div>
          <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 1: Tentukan Kepribadian Brand</h3>
          <p className="text-sm text-text-body mt-1">Ini fondasinya! Jawab 5 pertanyaan simpel ini, nanti Mang AI bikinin 3 pilihan kepribadian (persona) buat brand-mu. Pilih yang paling "kamu banget".</p>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="businessName" value={inputs.businessName} onChange={handleInputChange} placeholder="Nama Bisnis / Brand" className="input-field" />
        <input name="industry" value={inputs.industry} onChange={handleInputChange} placeholder="Industri (cth: F&B, Fashion)" className="input-field" />
        <textarea name="businessDetail" value={inputs.businessDetail} onChange={handleInputChange} placeholder="Jelaskan bisnismu secara singkat" className="input-field md:col-span-2" rows={2}></textarea>
        <input name="targetAudience" value={inputs.targetAudience} onChange={handleInputChange} placeholder="Target Audiens (cth: Mahasiswa, Ibu Rumah Tangga)" className="input-field" />
        <input name="valueProposition" value={inputs.valueProposition} onChange={handleInputChange} placeholder="Keunggulan dibanding kompetitor" className="input-field" />
      </div>

      <div className="text-center">
        <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading}>
          Buat 3 Pilihan Persona ({PERSONA_COST} Token)
        </Button>
      </div>

      {project.project_data.personas.length > 0 && (
        <div className="space-y-4 animate-content-fade-in">
          <h4 className="text-center font-bold text-lg text-text-header">Pilih Persona yang Paling Cocok:</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {project.project_data.personas.map(p => (
              <div 
                key={p.nama_persona} 
                onClick={() => handleSelectPersona(p)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${project.project_data.selectedPersona?.nama_persona === p.nama_persona ? 'selection-card-active' : 'selection-card'}`}
              >
                <h5 className="font-bold text-primary text-lg">{p.nama_persona}</h5>
                <p className="text-sm text-text-body mt-1">{p.deskripsi}</p>
                <p className="text-xs text-text-muted italic mt-2">"{p.gaya_bicara}"</p>
                <div className="flex gap-2 mt-3">
                  {p.palet_warna.map(c => <div key={c.hex} title={c.nama} className="w-6 h-6 rounded-full border-2 border-surface" style={{backgroundColor: c.hex}}></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.project_data.selectedPersona && (
        <div className="mt-6 pt-6 border-t border-border-main text-center animate-content-fade-in">
            <Button onClick={onComplete} variant="accent">
                Lanjut ke Desain Logo →
            </Button>
        </div>
      )}
    </div>
  );
};

export default BrandPersonaGenerator;
