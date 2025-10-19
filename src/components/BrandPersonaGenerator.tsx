// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateBrandPersonas } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, BrandPersona, ProjectData, BrandInputs } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import VoiceBrandingWizard from './VoiceBrandingWizard';
import BrandGuidelineDocument from './common/BrandGuidelineDocument';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const PERSONA_COST = 5;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const BrandPersonaGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [inputs, setInputs] = useState<BrandInputs>(project.project_data.brandInputs || { businessName: project.project_name, businessDetail: '', industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: '' });
  const [personas, setPersonas] = useState<BrandPersona[]>(project.project_data.brandPersonas || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [showSuccessCallout, setShowSuccessCallout] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { deductCredits, addXp, lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();

  useEffect(() => {
    if (lastVoiceConsultationResult) {
      setInputs(prev => ({ ...prev, ...lastVoiceConsultationResult }));
      setLastVoiceConsultationResult(null);
    }
  }, [lastVoiceConsultationResult, setLastVoiceConsultationResult]);
  
  const isFormComplete = inputs.businessName && inputs.industry && inputs.targetAudience && inputs.valueProposition;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!isFormComplete) {
      setError("Isi semua kolom yang wajib dulu ya, Juragan!");
      return;
    }
    setIsLoading(true);
    setError(null);
    setShowSuccessCallout(false);
    try {
      if (!(await deductCredits(PERSONA_COST))) return;
      
      const generatedPersonas = await generateBrandPersonas(inputs);
      setPersonas(generatedPersonas);
      await onUpdateProject({ brandInputs: inputs, brandPersonas: generatedPersonas, selectedPersona: null });
      await addXp(XP_REWARD);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat persona.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = async (persona: BrandPersona) => {
    playSound('select');
    await onUpdateProject({ selectedPersona: persona });
    setShowSuccessCallout(true);
    setTimeout(() => setShowSuccessCallout(false), 5000);
  };
  
  const handleDownloadPdf = async () => {
      if (!project.project_data.selectedPersona) return;
      setIsDownloadingPdf(true);
      
      const guidelineElement = document.getElementById('brand-guideline-pdf');
      if (guidelineElement) {
          try {
              const canvas = await html2canvas(guidelineElement, { scale: 2 });
              const imgData = canvas.toDataURL('image/png');
              
              const pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'px',
                  format: [canvas.width, canvas.height]
              });
              
              pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
              pdf.save(`${project.project_name}_brand_guideline.pdf`);
          } catch (error) {
              setError("Gagal membuat PDF: " + (error as Error).message);
          }
      }
      setIsDownloadingPdf(false);
  };

  return (
    <div className="space-y-6">
      <div id="persona-step-1">
        <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 1: DNA Brand Kamu</h3>
        <p className="text-sm text-text-body mt-1">Isi data ini biar Mang AI makin kenal sama brand-mu. Makin detail, makin mantap hasilnya!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nama Bisnis/Brand*" name="businessName" value={inputs.businessName} onChange={handleChange} />
        <Input label="Industri*" name="industry" value={inputs.industry} onChange={handleChange} placeholder="cth: F&B, Fashion, Teknologi" />
        <Textarea label="Target Audiens*" name="targetAudience" value={inputs.targetAudience} onChange={handleChange} rows={3} placeholder="cth: Mahasiswa, Ibu rumah tangga, Gamers" />
        <Textarea label="Keunggulan Utama (Value Proposition)*" name="valueProposition" value={inputs.valueProposition} onChange={handleChange} rows={3} placeholder="cth: Harga terjangkau, Bahan organik, Pelayanan 24 jam" />
        <Textarea label="Deskripsi Singkat Bisnis" name="businessDetail" value={inputs.businessDetail} onChange={handleChange} rows={2} placeholder="cth: Kedai kopi dengan biji kopi lokal" />
        <Textarea label="Analisis Kompetitor (Opsional)" name="competitorAnalysis" value={inputs.competitorAnalysis} onChange={handleChange} rows={2} placeholder="cth: Si A, keunggulannya X, kelemahannya Y" />
      </div>

       <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!isFormComplete || isLoading} className="w-full">
              {personas.length > 0 ? 'Buat Ulang Opsi Persona' : 'Gas, Buat Persona!'} ({PERSONA_COST} Token)
          </Button>
           <Button onClick={() => setWizardOpen(true)} variant='secondary' className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                Isi Lewat Suara
            </Button>
      </div>

      {error && <ErrorMessage message={error} />}
      
      {personas.length > 0 && (
        <div id="persona-step-2" className="space-y-4 animate-content-fade-in">
          <h3 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Pilih Persona yang Paling "Lo Banget"</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {personas.map((p, i) => (
              <div key={i} className={`p-4 rounded-lg cursor-pointer selection-card ${project.project_data.selectedPersona?.nama_persona === p.nama_persona ? 'selection-card-active' : ''}`} onClick={() => handleSelectPersona(p)}>
                <h4 className="font-bold text-text-header">{p.nama_persona}</h4>
                <p className="text-xs text-text-body mt-1">{p.deskripsi}</p>
                <div className="flex gap-2 mt-3">
                  {p.palet_warna.map(c => <div key={c.hex} title={c.nama} className="w-5 h-5 rounded-full border border-surface" style={{backgroundColor: c.hex}} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showSuccessCallout && project.project_data.selectedPersona && (
        <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main animate-content-fade-in">
          <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-16 h-16" style={{imageRendering: 'pixelated'}} />
          <div>
            <h4 className="font-bold text-text-header">Mantap, Persona "{project.project_data.selectedPersona.nama_persona}" Dipilih!</h4>
            <p className="text-sm text-text-body mt-1">Persona ini bakal jadi acuan buat bikin logo, konten, dan semua elemen brand-mu. Lanjut ke tab "Logo" yuk, Juragan!</p>
          </div>
        </div>
      )}

      {project.project_data.selectedPersona && (
        <div className="mt-4 p-4 bg-background rounded-lg">
          <h4 className="font-bold text-text-header mb-2">Buku Panduan Brand (Brand Guideline)</h4>
          <p className="text-sm text-text-body mb-3">Unduh rangkuman DNA brand-mu dalam format PDF. Berguna banget buat briefing tim atau vendor!</p>
          <Button onClick={handleDownloadPdf} isLoading={isDownloadingPdf} variant="secondary" size="small" disabled={!project.project_data.selectedLogoUrl}>
            {project.project_data.selectedLogoUrl ? 'Unduh Guideline (.pdf)' : 'Lengkapi Logo Dulu'}
          </Button>
        </div>
      )}

      {/* Hidden component for PDF generation */}
      <div className="absolute -left-[9999px] top-0">
          <BrandGuidelineDocument project={project} />
      </div>

      <VoiceBrandingWizard show={isWizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
};

export default BrandPersonaGenerator;
