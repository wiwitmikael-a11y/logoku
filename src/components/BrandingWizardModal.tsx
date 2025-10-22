// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { BrandInputs, BrandPersona, ProjectData } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateBrandPersonas, generateLogoPrompt, generateLogoOptions } from '../services/geminiService';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';
import Select from './common/Select';

const PERSONA_COST = 5;
const LOGO_COST = 5; // Bundled prompt + generation cost
const TOTAL_STEPS = 3;

interface Props {
  show: boolean;
  onClose: () => void;
  onComplete: (projectData: ProjectData) => void;
}

const BrandingWizardModal: React.FC<Props> = ({ show, onClose, onComplete }) => {
  const { deductCredits } = useUserActions();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data collected through the wizard
  const [inputs, setInputs] = useState<BrandInputs>({ businessName: '', businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' });
  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<BrandPersona | null>(null);
  const [logoPrompt, setLogoPrompt] = useState<string>('');
  const [logoStyle, setLogoStyle] = useState('Vector');
  const [logoOptions, setLogoOptions] = useState<string[]>([]);

  if (!show) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleNextToPersona = async () => {
    if (!inputs.businessName || !inputs.businessDetail) {
      setError("Nama dan detail bisnis wajib diisi!");
      return;
    }
    setIsLoading(true); setError(null);
    try {
      if (!(await deductCredits(PERSONA_COST))) return;
      const generatedPersonas = await generateBrandPersonas(inputs);
      setPersonas(generatedPersonas);
      setStep(2);
      playSound('success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextToLogo = async () => {
    if (!selectedPersona) { setError("Pilih satu persona dulu, Juragan!"); return; }
    setIsLoading(true); setError(null);
    try {
      if (!(await deductCredits(LOGO_COST))) return;
      const slogan = `Slogan untuk ${inputs.businessName}`; // Dummy slogan for prompt
      const prompt = await generateLogoPrompt(slogan, selectedPersona);
      setLogoPrompt(prompt);
      const logos = await generateLogoOptions(prompt, logoStyle);
      setLogoOptions(logos);
      setStep(3);
      playSound('success');
    } catch(err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFinish = (selectedLogoUrl: string) => {
     if (!selectedPersona) return;
     const finalProjectData: ProjectData = {
        project_name: inputs.businessName,
        brandInputs: inputs,
        brandPersonas: personas,
        selectedPersona: selectedPersona,
        slogans: [],
        selectedSlogan: null,
        logoPrompt: logoPrompt,
        logoOptions: logoOptions,
        selectedLogoUrl: selectedLogoUrl,
        logoVariations: [],
        socialMediaKit: null,
        socialProfiles: null,
        contentCalendar: null
     };
     onComplete(finalProjectData);
     // Reset state for next time
     setStep(1);
     setInputs({ businessName: '', businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' });
     setPersonas([]);
     setSelectedPersona(null);
     setLogoOptions([]);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3 className="text-xl font-bold text-text-header mb-2">Langkah 1: Info Brand</h3>
            <p className="text-sm text-text-muted mb-4">Isi detail bisnismu. Semakin lengkap, semakin jago Mang AI bantuinnya!</p>
            <div className="flex flex-col gap-4">
              <Input label="Nama Bisnis / Brand" name="businessName" value={inputs.businessName} onChange={handleInputChange} placeholder="Contoh: Kopi Senja" />
              <Input label="Industri / Bidang Usaha" name="industry" value={inputs.industry} onChange={handleInputChange} placeholder="Contoh: Kedai Kopi, Fashion" />
              <Textarea label="Jelaskan Bisnismu" name="businessDetail" value={inputs.businessDetail} onChange={handleInputChange} rows={3} placeholder="Contoh: Kami menjual biji kopi arabika spesialti." />
              <Textarea label="Siapa Target Pasarmu?" name="targetAudience" value={inputs.targetAudience} onChange={handleInputChange} rows={2} placeholder="Contoh: Mahasiswa & pekerja kantoran."/>
              <Textarea label="Apa Keunggulan Utamamu?" name="valueProposition" value={inputs.valueProposition} onChange={handleInputChange} rows={2} placeholder="Contoh: Biji kopi di-roasting sendiri setiap hari." />
            </div>
          </>
        );
      case 2:
        return (
           <>
            <h3 className="text-xl font-bold text-text-header mb-2">Langkah 2: Pilih Persona</h3>
            <p className="text-sm text-text-muted mb-4">Ini adalah "kepribadian" brand-mu. Pilih yang paling pas!</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personas.map((p, i) => (
              <div key={i} onClick={() => setSelectedPersona(p)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPersona?.nama_persona === p.nama_persona ? 'selection-card-active' : 'selection-card'}`}>
                <h5 className="font-bold text-primary">{p.nama_persona}</h5>
                <p className="text-xs text-text-body mt-1">{p.deskripsi}</p>
                <div className="flex gap-2 mt-3">
                  {p.palet_warna.map(c => <div key={c.hex} className="w-5 h-5 rounded-full border border-surface" style={{backgroundColor: c.hex}} title={c.nama}/>)}
                </div>
              </div>
            ))}
          </div>
           </>
        );
    case 3:
        return (
            <>
            <h3 className="text-xl font-bold text-text-header mb-2">Langkah 3: Pilih Logo Juara</h3>
            <p className="text-sm text-text-muted mb-4">Logo adalah wajah brand-mu. Klik pada logo favoritmu untuk menyelesaikan wizard.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {logoOptions.map(url => (
                    <div key={url} className={`p-2 rounded-lg cursor-pointer transition-all group selection-card`} onClick={() => handleFinish(url)}>
                        <img src={url} alt="logo option" className="w-full aspect-square object-contain bg-white rounded-md"/>
                    </div>
                ))}
            </div>
            </>
        );
      default:
        return null;
    }
  };
  
  const renderNextButton = () => {
    switch(step) {
      case 1:
        return <Button onClick={handleNextToPersona} isLoading={isLoading} disabled={!inputs.businessName || !inputs.businessDetail}>Lanjut ({PERSONA_COST} ✨)</Button>;
      case 2:
         return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-grow">
                <Select 
                    label="Gaya Logo"
                    name="logoStyle"
                    value={logoStyle}
                    onChange={e => setLogoStyle(e.target.value)}
                    options={[
                        {value: 'Vector', label: 'Vector'},
                        {value: '3D', label: '3D'},
                        {value: 'Cartoon', label: 'Kartun'},
                        {value: 'Pixel Art', label: 'Pixel Art'},
                        {value: 'Hand-drawn', label: 'Gambar Tangan'},
                    ]}
                />
            </div>
            <div className="flex-shrink-0 pt-5 sm:pt-0 self-end">
                <Button onClick={handleNextToLogo} isLoading={isLoading} disabled={!selectedPersona} className="w-full sm:w-auto">Lanjut ({LOGO_COST} ✨)</Button>
            </div>
          </div>
        );
      case 3:
        return null; // Finish is handled by clicking the image
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}>
      <div className="relative max-w-2xl w-full bg-surface rounded-2xl shadow-xl flex flex-col">
        <div className="p-6 border-b border-border-main">
            <h2 className="text-2xl font-bold text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Wizard Branding Kilat</h2>
            <div className="mt-2">
                <div className="progress-bar">
                    <div className="progress-bar-inner" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                </div>
            </div>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto max-h-[60vh] min-h-[200px]">
            {isLoading ? <div className="flex flex-col items-center justify-center h-full"><Spinner /><p className="mt-2 text-sm">Mang AI lagi kerja, sabar ya...</p></div> : renderStep()}
        </div>
        
        <div className="p-4 bg-background/50 rounded-b-2xl border-t border-border-main flex justify-between items-center">
          <div className="min-h-[2rem]">{error && <ErrorMessage message={error} />}</div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary" disabled={isLoading}>Batal</Button>
            {renderNextButton()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingWizardModal;