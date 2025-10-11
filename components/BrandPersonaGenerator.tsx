// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateBrandPersona, generateSlogans, analyzeCompetitorUrl } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { loadWorkflowState } from '../services/workflowPersistence';
import type { BrandPersona, BrandInputs } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  onComplete: (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => void;
  onGoToDashboard: () => void;
}

const businessCategories = ["Makanan", "Minuman", "Fashion", "Jasa", "Kecantikan & Perawatan Diri", "Kerajinan Tangan & Dekorasi Rumah", "Agrikultur & Produk Tani", "Lainnya"];
const targetAudienceCategories = ["Masyarakat Umum", "Mahasiswa", "Pekerja Kantoran", "Keluarga", "Remaja", "Anak-anak"];

const BrandPersonaGenerator: React.FC<Props> = ({ onComplete, onGoToDashboard }) => {
  const [formState, setFormState] = useState({
    businessName: '',
    businessCategory: 'Makanan',
    businessDetail: '',
    targetAudienceCat: 'Masyarakat Umum',
    targetAudienceAge: '',
    valueProposition: 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
    competitors: '',
    competitorUrl: '',
  });

  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState<number | null>(null);
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoadingSlogan, setIsLoadingSlogan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { grantFirstTimeCompletionBonus } = useUserActions();

  const personasRef = useRef<HTMLDivElement>(null);
  const slogansRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onboardingFlag = sessionStorage.getItem('onboardingStep2');
    if (onboardingFlag) {
        setShowOnboarding(true);
        sessionStorage.removeItem('onboardingStep2');
    }

    const persistedState = loadWorkflowState();
    if (persistedState?.brandInputs) {
      const { businessName, businessCategory, businessDetail, targetAudience, valueProposition, competitors } = persistedState.brandInputs;
      const ageMatch = targetAudience.match(/usia ([\d\-]+)/i);
      const age = ageMatch ? ageMatch[1] : '';
      const category = targetAudience.replace(/(\s+usia\s+[\d\-]+)/i, '').trim() || 'Masyarakat Umum';
      
      setFormState(prev => ({
        ...prev,
        businessName: businessName || '',
        businessCategory: businessCategory || 'Makanan',
        businessDetail: businessDetail || '',
        targetAudienceCat: category,
        targetAudienceAge: age,
        valueProposition: valueProposition || 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
        competitors: competitors || '',
      }));
    }
  }, []);

  useEffect(() => {
    if (personas.length > 0 && personasRef.current) personasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [personas]);

  useEffect(() => {
    if (slogans.length > 0 && slogansRef.current) slogansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [slogans]);
  
  useEffect(() => {
    if (selectedSlogan) {
      const timer = setTimeout(() => setShowNextStepNudge(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowNextStepNudge(false);
    }
  }, [selectedSlogan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePersona = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const requiredFields: (keyof typeof formState)[] = ['businessName', 'businessDetail', 'targetAudienceAge', 'valueProposition'];
    if (!formState.competitors.trim() && !formState.competitorUrl.trim()) {
      setError("Waduh, Juragan! Tolong isi salah satu, kompetitor via teks atau via URL ya.");
      playSound('error');
      return;
    }
    const emptyField = requiredFields.find(field => !formState[field].trim());
    if (emptyField) {
        setError("Waduh, Juragan! Ada isian yang masih kosong, nih. Tolong lengkapi dulu semua detailnya ya.");
        playSound('error');
        return;
    }

    setIsLoadingPersona(true);
    setAnalysisResult(null);
    let competitorAnalysis: string | null = null;
    setPersonas([]);
    setSlogans([]);
    setSelectedPersonaIndex(null);
    setSelectedSlogan(null);
    setShowNextStepNudge(false);
    playSound('start');

    const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
    const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge ? ` usia ${formState.targetAudienceAge}` : ''}`.trim();

    try {
      if (formState.competitorUrl.trim()) {
        setIsAnalyzing(true);
        competitorAnalysis = await analyzeCompetitorUrl(formState.competitorUrl, formState.businessName);
        setAnalysisResult(competitorAnalysis);
        setIsAnalyzing(false);
      }

      const result = await generateBrandPersona(
        formState.businessName, combinedIndustry, combinedAudience, formState.valueProposition, competitorAnalysis
      );
      setPersonas(result);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoadingPersona(false);
      setIsAnalyzing(false);
    }
  }, [formState]);
  
  const handleSelectPersona = useCallback((index: number) => {
      if (selectedPersonaIndex !== index) {
        setSelectedPersonaIndex(index);
        setSlogans([]);
        setSelectedSlogan(null);
        setShowNextStepNudge(false);
      }
  }, [selectedPersonaIndex]);
  
  const handleGenerateSlogans = useCallback(async () => {
    if (selectedPersonaIndex === null || !personas[selectedPersonaIndex]) return;
    setIsLoadingSlogan(true);
    setError(null);
    setSlogans([]);
    playSound('start');

    try {
        const result = await generateSlogans(formState.businessName, personas[selectedPersonaIndex], formState.competitors);
        setSlogans(result);
        playSound('success');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal generate slogan.');
        playSound('error');
    } finally {
        setIsLoadingSlogan(false);
    }
  }, [selectedPersonaIndex, personas, formState]);

  const handleContinue = async () => {
    if (selectedPersonaIndex === null || !selectedSlogan || !personas[selectedPersonaIndex]) return;
    await grantFirstTimeCompletionBonus('persona'); 
    const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
    const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge ? ` usia ${formState.targetAudienceAge}` : ''}`.trim();
    const inputs: BrandInputs = { ...formState, industry: combinedIndustry, targetAudience: combinedAudience, businessCategory: formState.businessCategory, businessDetail: formState.businessDetail, businessName: formState.businessName, competitors: formState.competitors, valueProposition: formState.valueProposition };
    onComplete({ inputs, selectedPersona: personas[selectedPersonaIndex], selectedSlogan });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 1: Fondasi Brand Lo</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Ceritain bisnismu. Mang AI akan meracik 3 pilihan persona, lengkap dengan target pasar, gaya bicara, palet warna, dan beberapa opsi slogan yang paling pas.</p>
      </div>

      <Card title="Detail Bisnis" className="p-4 sm:p-6">
        <form ref={formRef} onSubmit={handleGeneratePersona} className="flex flex-col gap-6">
          <Input label="Nama Bisnis" name="businessName" value={formState.businessName} onChange={handleChange} placeholder="cth: Kopi Senja" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                   <label htmlFor="businessCategory" className="block mb-1.5 text-sm font-medium text-text-muted">Kategori Bisnis</label>
                   <select id="businessCategory" name="businessCategory" value={formState.businessCategory} onChange={handleChange} className="w-full px-3 py-2 text-text-body bg-surface border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-splash/50 focus:border-splash transition-colors">
                      {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
              </div>
               <Input label="Detail Bisnis" name="businessDetail" value={formState.businessDetail} onChange={handleChange} placeholder="cth: Kopi Susu Gula Aren" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                   <label htmlFor="targetAudienceCat" className="block mb-1.5 text-sm font-medium text-text-muted">Target Pasar</label>
                   <select id="targetAudienceCat" name="targetAudienceCat" value={formState.targetAudienceCat} onChange={handleChange} className="w-full px-3 py-2 text-text-body bg-surface border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-splash/50 focus:border-splash transition-colors">
                      {targetAudienceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
              </div>
               <Input label="Usia Target Pasar (Tahun)" name="targetAudienceAge" value={formState.targetAudienceAge} onChange={handleChange} placeholder="cth: 18-25" />
          </div>

          <Textarea label="Yang Bikin Beda (Value Proposition)" name="valueProposition" value={formState.valueProposition} onChange={handleChange} placeholder="cth: Organik, murah, mewah" rows={3} />
          
          <div>
            <Textarea label="Sebutin 1-2 Kompetitor (via Teks)" name="competitors" value={formState.competitors} onChange={handleChange} placeholder="cth: Starbucks, Janji Jiwa" rows={2} />
            <div className="text-center text-sm text-text-muted my-2">- ATAU -</div>
            <Input label="URL Kompetitor (Opsional, Lebih Akurat)" name="competitorUrl" value={formState.competitorUrl} onChange={handleChange} placeholder="cth: https://www.instagram.com/kompetitor" />
            {analysisResult && (
                <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-semibold text-primary">Lihat Hasil Analisis Kompetitor</summary>
                    <div className="mt-2 p-3 bg-background rounded-md border border-border-main whitespace-pre-wrap selectable-text">
                        {analysisResult}
                    </div>
                </details>
            )}
          </div>
          
          <div className="relative flex items-center gap-4 pt-4 border-t border-border-main">
            {showOnboarding && (
                <div onClick={() => setShowOnboarding(false)} className="absolute bottom-full left-0 mb-2 w-max cursor-pointer animate-bounce">
                    <CalloutPopup>Isi detailnya, biar Mang AI bisa ngeracik!</CalloutPopup>
                </div>
            )}
            <Button type="submit" isLoading={isLoadingPersona}>Racik Persona Sekarang!</Button>
             {personas.length > 0 && !isLoadingPersona && (
              <Button variant="secondary" onClick={() => handleGeneratePersona()} isLoading={isLoadingPersona}>Racik Ulang Persona</Button>
            )}
            {isLoadingPersona && (
              <p className="text-sm text-accent animate-pulse">{isAnalyzing ? 'Menganalisis URL kompetitor...' : 'Meracik persona...'}</p>
            )}
          </div>
        </form>
      </Card>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {personas.length > 0 && (
        <div ref={personasRef} className="flex flex-col gap-6 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-text-header">Pilih Persona Brand Lo:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <Card 
                key={index} 
                title={persona.nama_persona}
                onClick={() => handleSelectPersona(index)}
                isSelected={selectedPersonaIndex === index}
              >
                <p className="text-text-body mb-4 h-24 overflow-auto selectable-text">{persona.deskripsi_singkat}</p>
                {selectedPersonaIndex === index && (
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border-main animate-content-fade-in">
                        <div>
                            <h4 className="font-semibold text-text-header mb-2">Avatar Pelanggan:</h4>
                            {persona.customer_avatars.map((avatar, i) => (
                                <div key={i} className="text-xs p-2 bg-background rounded-md mb-2 selectable-text text-text-body">
                                    <strong>{avatar.nama_avatar}:</strong> {avatar.deskripsi_demografis}. Aktif di {avatar.media_sosial.join(', ')}.
                                </div>
                            ))}
                        </div>
                        <div className="selectable-text">
                            <h4 className="font-semibold text-text-header mb-2">Gaya Bicara:</h4>
                            <p className="text-xs text-text-body"><strong>Gunakan:</strong> {persona.brand_voice.kata_yang_digunakan.join(', ')}</p>
                            <p className="text-xs text-text-body"><strong>Hindari:</strong> {persona.brand_voice.kata_yang_dihindari.join(', ')}</p>
                        </div>
                        <div>
                           <h4 className="font-semibold text-text-header mb-2">Palet Warna:</h4>
                           <div className="flex items-center gap-3">
                            {persona.palet_warna_hex.map((hex, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-border-main" style={{ backgroundColor: hex }}></div>
                            ))}
                           </div>
                        </div>
                    </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedPersonaIndex !== null && (
        <Card title="Langkah 1.5: Pilih Slogan" className="p-4 sm:p-6" ref={slogansRef}>
            <p className="text-text-muted mb-4">Persona "{personas[selectedPersonaIndex].nama_persona}" udah kepilih. Sekarang, ayo kita buat beberapa pilihan slogan yang pas.</p>
            {slogans.length === 0 ? (
                <Button onClick={handleGenerateSlogans} isLoading={isLoadingSlogan}>Bikinin Slogan Dong!</Button>
            ) : (
              <div className="flex flex-col gap-4">
                  <h4 className="font-semibold mb-2 text-text-header">Pilih Slogan Andalan Lo:</h4>
                  <div className="flex flex-wrap gap-3">
                      {slogans.map((slogan, index) => (
                          <button
                              key={index}
                              onClick={() => { playSound('select'); setSelectedSlogan(slogan); }}
                              onMouseEnter={() => playSound('hover')}
                              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 selectable-text ${selectedSlogan === slogan ? 'bg-primary text-white' : 'bg-background text-text-body hover:bg-border-main'}`}
                          >
                              {slogan}
                          </button>
                      ))}
                  </div>
              </div>
            )}
        </Card>
      )}
      
      {(selectedPersonaIndex !== null && selectedSlogan) && (
        <div className="self-center mt-4 relative">
            {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Sip! Klik di sini buat lanjut.</CalloutPopup>
            )}
            <Button onClick={handleContinue} size="large">Mantap, Lanjut Bikin Logo &rarr;</Button>
        </div>
      )}
    </div>
  );
};

export default BrandPersonaGenerator;