import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateBrandPersona, generateSlogans } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { loadWorkflowState } from '../services/workflowPersistence';
import type { BrandPersona, BrandInputs } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup'; // Import the new component

interface Props {
  onComplete: (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => void;
}

const businessCategories = ["Makanan", "Minuman", "Fashion", "Jasa", "Kecantikan", "Kerajinan Tangan", "Lainnya"];
const targetAudienceCategories = ["Masyarakat Umum", "Mahasiswa", "Pekerja Kantoran", "Keluarga", "Remaja", "Anak-anak"];

const BrandPersonaGenerator: React.FC<Props> = ({ onComplete }) => {
  // NEW: Local form state to handle the split audience input and empty defaults
  const [formState, setFormState] = useState({
    businessName: '',
    businessCategory: 'Makanan',
    businessDetail: '',
    targetAudienceCat: 'Masyarakat Umum',
    targetAudienceAge: '',
    valueProposition: 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
    competitors: '',
  });

  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState<number | null>(null);
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isLoadingSlogan, setIsLoadingSlogan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false); // State for the nudge

  const personasRef = useRef<HTMLDivElement>(null);
  const slogansRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load persisted state and parse it into the local form state
    const persistedState = loadWorkflowState();
    if (persistedState?.brandInputs) {
      const { businessName, businessCategory, businessDetail, targetAudience, valueProposition, competitors } = persistedState.brandInputs;
      
      // Simple regex to parse back the age
      const ageMatch = targetAudience.match(/usia ([\d\-]+)/i);
      const age = ageMatch ? ageMatch[1] : '';
      const category = targetAudience.replace(/(\s+usia\s+[\d\-]+)/i, '').trim() || 'Masyarakat Umum';
      
      setFormState({
        businessName: businessName || '',
        businessCategory: businessCategory || 'Makanan',
        businessDetail: businessDetail || '',
        targetAudienceCat: category,
        targetAudienceAge: age,
        valueProposition: valueProposition || 'Kualitas premium dengan harga terjangkau dan pelayanan yang ramah.',
        competitors: competitors || '',
      });
    }
  }, []);

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (personas.length > 0 && personasRef.current) {
      personasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [personas]);

  useEffect(() => {
    if (slogans.length > 0 && slogansRef.current) {
      slogansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [slogans]);
  
  // Show nudge when a slogan is selected
  useEffect(() => {
    if (selectedSlogan) {
      const timer = setTimeout(() => setShowNextStepNudge(true), 300); // Small delay
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
    setIsLoadingPersona(true);
    setError(null);
    setPersonas([]);
    setSlogans([]);
    setSelectedPersonaIndex(null);
    setSelectedSlogan(null);
    setShowNextStepNudge(false); // Reset nudge
    playSound('start');

    const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
    const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge ? ` usia ${formState.targetAudienceAge}` : ''}`.trim();

    try {
      const result = await generateBrandPersona(
        formState.businessName,
        combinedIndustry,
        combinedAudience,
        formState.valueProposition
      );
      setPersonas(result);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoadingPersona(false);
    }
  }, [formState]);
  
  const handleSelectPersona = useCallback((index: number) => {
      if (selectedPersonaIndex !== index) {
        setSelectedPersonaIndex(index);
        // Reset slogan state when a new persona is chosen
        setSlogans([]);
        setSelectedSlogan(null);
        setShowNextStepNudge(false); // Reset nudge
      }
  }, [selectedPersonaIndex]);
  
  const handleGenerateSlogans = useCallback(async () => {
    if (selectedPersonaIndex === null || !personas[selectedPersonaIndex]) return;

    setIsLoadingSlogan(true);
    setError(null);
    setSlogans([]); // Clear previous slogans
    playSound('start');

    try {
        const result = await generateSlogans(formState.businessName, personas[selectedPersonaIndex], formState.competitors);
        setSlogans(result);
        playSound('success');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal generate slogan.';
        setError(errorMessage);
        playSound('error');
    } finally {
        setIsLoadingSlogan(false);
    }
  }, [selectedPersonaIndex, personas, formState]);


  const handleContinue = () => {
    if (selectedPersonaIndex !== null && selectedSlogan && personas[selectedPersonaIndex]) {
      const combinedIndustry = `${formState.businessCategory} ${formState.businessDetail}`.trim();
      const combinedAudience = `${formState.targetAudienceCat}${formState.targetAudienceAge ? ` usia ${formState.targetAudienceAge}` : ''}`.trim();
      
      const inputs: BrandInputs = {
        businessName: formState.businessName,
        businessCategory: formState.businessCategory,
        businessDetail: formState.businessDetail,
        industry: combinedIndustry,
        targetAudience: combinedAudience,
        valueProposition: formState.valueProposition,
        competitors: formState.competitors,
      };

      onComplete({
        inputs,
        selectedPersona: personas[selectedPersonaIndex],
        selectedSlogan: selectedSlogan,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 1: Fondasi Brand Lo</h2>
        <p className="text-gray-400">Ceritain bisnismu. Mang AI akan meracik persona, target avatar, gaya bicara, sampai slogan yang paling pas.</p>
      </div>

      <form onSubmit={handleGeneratePersona} className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <Input label="Nama Bisnis" name="businessName" value={formState.businessName} onChange={handleChange} placeholder="cth: Kopi Senja" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                 <label htmlFor="businessCategory" className="block mb-2 text-sm font-medium text-gray-300">Kategori Bisnis</label>
                 <select
                    id="businessCategory"
                    name="businessCategory"
                    value={formState.businessCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                 >
                    {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
            </div>
             <Input label="Detail Bisnis" name="businessDetail" value={formState.businessDetail} onChange={handleChange} placeholder="cth: Kopi Susu Gula Aren" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                 <label htmlFor="targetAudienceCat" className="block mb-2 text-sm font-medium text-gray-300">Target Pasar</label>
                 <select
                    id="targetAudienceCat"
                    name="targetAudienceCat"
                    value={formState.targetAudienceCat}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                 >
                    {targetAudienceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
            </div>
             <Input label="Usia Target Pasar (Tahun)" name="targetAudienceAge" value={formState.targetAudienceAge} onChange={handleChange} placeholder="cth: 18-25" />
        </div>

        <Textarea label="Yang Bikin Beda (Value Proposition)" name="valueProposition" value={formState.valueProposition} onChange={handleChange} placeholder="cth: Organik, murah, mewah" rows={3} />
        <Textarea label="Sebutin 1-2 Kompetitor" name="competitors" value={formState.competitors} onChange={handleChange} placeholder="cth: Starbucks, Janji Jiwa" rows={2} />
        
        <div className="flex items-center gap-4">
          <Button type="submit" isLoading={isLoadingPersona}>
            Racik Persona Sekarang!
          </Button>
           {personas.length > 0 && !isLoadingPersona && (
            <Button variant="secondary" onClick={() => handleGeneratePersona()} isLoading={isLoadingPersona}>
              Racik Ulang Persona
            </Button>
          )}
        </div>
      </form>

      {error && <ErrorMessage message={error} />}

      {personas.length > 0 && (
        <>
        <div ref={personasRef} className="flex flex-col gap-6 scroll-mt-24">
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Pilih Persona Brand Lo:</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <Card 
                key={index} 
                title={persona.nama_persona}
                onClick={() => handleSelectPersona(index)}
                isSelected={selectedPersonaIndex === index}
              >
                <p className="text-gray-300 mb-4 h-20 overflow-auto">{persona.deskripsi_singkat}</p>
                
                {selectedPersonaIndex === index && (
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-gray-700">
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">Avatar Pelanggan:</h4>
                            {persona.customer_avatars.map((avatar, i) => (
                                <div key={i} className="text-xs p-2 bg-gray-700/50 rounded-md mb-2">
                                    <strong>{avatar.nama_avatar}:</strong> {avatar.deskripsi_demografis}. Aktif di {avatar.media_sosial.join(', ')}.
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">Gaya Bicara:</h4>
                            <p className="text-xs text-gray-400"><strong>Gunakan:</strong> {persona.brand_voice.kata_yang_digunakan.join(', ')}</p>
                            <p className="text-xs text-gray-400"><strong>Hindari:</strong> {persona.brand_voice.kata_yang_dihindari.join(', ')}</p>
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-200 mb-2">Palet Warna:</h4>
                           <div className="flex items-center gap-3">
                            {persona.palet_warna_hex.map((hex, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-500" style={{ backgroundColor: hex }}></div>
                            ))}
                           </div>
                        </div>
                    </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {selectedPersonaIndex !== null && (
          <div ref={slogansRef} className="flex flex-col gap-6 mt-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700 transition-opacity duration-500 animate-fade-in scroll-mt-24">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 1.5: Generate Slogan</h3>
              <p className="text-gray-400">Persona "{personas[selectedPersonaIndex].nama_persona}" udah kepilih. Sekarang, ayo kita buat beberapa pilihan slogan yang pas.</p>
            </div>

            {slogans.length === 0 && (
              <div className="self-start">
                  <Button onClick={handleGenerateSlogans} isLoading={isLoadingSlogan}>
                      Bikinin Slogan Dong!
                  </Button>
              </div>
            )}

            {slogans.length > 0 && (
              <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold mb-2">Pilih Slogan Andalan Lo:</h4>
                  <div className="flex flex-wrap gap-3">
                      {slogans.map((slogan, index) => (
                          <button
                              key={index}
                              onClick={() => {
                                playSound('select');
                                setSelectedSlogan(slogan);
                              }}
                              onMouseEnter={() => playSound('hover')}
                              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                                  selectedSlogan === slogan
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                          >
                              {slogan}
                          </button>
                      ))}
                  </div>
              </div>
            )}
          </div>
        )}
      </>
      )}
      
      {(selectedPersonaIndex !== null && selectedSlogan) && (
        <div className="self-center mt-4 relative">
            {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max animate-fade-in">
                Sip! Klik di sini buat lanjut.
              </CalloutPopup>
            )}
            <Button onClick={handleContinue}>
              Mantap, Lanjut Bikin Logo &rarr;
            </Button>
        </div>
      )}
    </div>
  );
};

export default BrandPersonaGenerator;