// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateBrandPersonas } from '../services/geminiService';
import { playSound } from '../services/soundService';
import type { Project, ProjectData, BrandInputs, BrandPersona } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';

const PERSONA_COST = 5;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { profile } = useAuth();
  const { deductCredits, addXp } = useUserActions();
  const [inputs, setInputs] = useState<BrandInputs>(project.project_data.brandInputs || {
    businessName: '',
    businessDetail: '',
    industry: '',
    targetAudience: '',
    valueProposition: '',
    competitorAnalysis: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputs(project.project_data.brandInputs || { businessName: project.project_data.project_name, businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' });
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!inputs.businessName || !inputs.businessDetail) {
      setError("Nama dan detail bisnis wajib diisi!");
      return;
    }
    if ((profile?.credits ?? 0) < PERSONA_COST) {
      setError(`Token tidak cukup. Butuh ${PERSONA_COST} token.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!(await deductCredits(PERSONA_COST))) return;
      
      const personas = await generateBrandPersonas(inputs);
      await onUpdateProject({ brandInputs: inputs, brandPersonas: personas, selectedPersona: personas[0] });
      await addXp(XP_REWARD);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.');
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
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full">
          <span className="text-3xl">👤</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 1: Tentukan Kepribadian Brand</h3>
          <p className="text-sm text-text-body mt-1">Jawab beberapa pertanyaan simpel ini, dan Mang AI bakal meracik 3 pilihan "kepribadian" atau persona untuk brand Juragan. Persona ini bakal jadi panduan buat semua materi branding ke depannya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nama Bisnis / Brand" name="businessName" value={inputs.businessName} onChange={handleInputChange} placeholder="Contoh: Kopi Senja" />
        <Input label="Industri / Bidang Usaha" name="industry" value={inputs.industry} onChange={handleInputChange} placeholder="Contoh: Kedai Kopi, Fashion, Jasa Digital" />
        <Textarea label="Jelaskan Bisnismu" name="businessDetail" value={inputs.businessDetail} onChange={handleInputChange} placeholder="Contoh: Kami menjual biji kopi arabika spesialti dan minuman kopi siap saji." rows={3} className="md:col-span-2" />
        <Textarea label="Siapa Target Pasarmu?" name="targetAudience" value={inputs.targetAudience} onChange={handleInputChange} placeholder="Contoh: Mahasiswa dan pekerja kantoran umur 20-35 tahun." rows={3} />
        <Textarea label="Apa Keunggulan Utamamu?" name="valueProposition" value={inputs.valueProposition} onChange={handleInputChange} placeholder="Contoh: Biji kopi kami di-roasting sendiri setiap hari, jadi selalu segar." rows={3} />
      </div>

      <div className="text-center">
        <Button onClick={handleGenerate} isLoading={isLoading} variant="primary">
          Buat Persona Brand! ({PERSONA_COST} Token)
        </Button>
        {error && <ErrorMessage message={error} />}
      </div>

      {project.project_data.brandPersonas.length > 0 && (
        <div className="animate-content-fade-in space-y-4">
          <h4 className="text-xl font-bold text-center text-text-header">Pilih Persona yang Paling "Lo Banget"!</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.project_data.brandPersonas.map((p, i) => (
              <div key={i} onClick={() => handleSelectPersona(p)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${project.project_data.selectedPersona?.nama_persona === p.nama_persona ? 'border-primary bg-primary/5' : 'border-border-main hover:border-primary/50'}`}>
                <h5 className="font-bold text-primary">{p.nama_persona}</h5>
                <p className="text-xs text-text-body mt-1">{p.deskripsi}</p>
                <div className="flex gap-2 mt-3">
                  {p.palet_warna.map(c => <div key={c.hex} className="w-5 h-5 rounded-full" style={{backgroundColor: c.hex}} title={c.nama}/>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandPersonaGenerator;
