
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateMerchandiseMockup } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (merchandiseUrl: string) => void;
}

type MerchType = 't-shirt' | 'mug' | 'tote-bag';
const GENERATION_COST = 1;

const merchandiseTypes: { id: MerchType; name: string; prompt: string }[] = [
  {
    id: 't-shirt',
    name: 'T-Shirt',
    prompt:
      'Take the provided logo image. Create a realistic mockup of a plain colored t-shirt on a clean, neutral background. The t-shirt prominently features the logo. The photo is high-quality, commercial-style, showing the texture of the fabric.',
  },
  {
    id: 'mug',
    name: 'Mug',
    prompt:
      'Take the provided logo image. Create a realistic mockup of a ceramic coffee mug on a simple table. The mug has the logo printed on it. The lighting is soft and natural, product photography style.',
  },
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    prompt:
      'Take the provided logo image. Create a realistic mockup of a canvas tote bag hanging against a clean wall. The tote bag has the logo printed in the center. The image looks like a professional product photo for an online store.',
  },
];


const MerchandiseGenerator: React.FC<Props> = ({ projectData, onComplete }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [activeTab, setActiveTab] = useState<MerchType>('t-shirt');
  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignBase64, setSelectedDesignBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    const currentMerch = merchandiseTypes.find(m => m.id === activeTab);
    if (currentMerch) {
      setPrompt(currentMerch.prompt);
    }
  }, [activeTab]);

  useEffect(() => {
    if (designs.length > 0 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    if (!prompt || !projectData.selectedLogoUrl) {
        setError("Data logo tidak ditemukan untuk membuat mockup merchandise.");
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignBase64(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      // FIX: Correctly call generateMerchandiseMockup with two arguments.
      const results = await generateMerchandiseMockup(prompt, projectData.selectedLogoUrl);
      
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      setSelectedDesignBase64(results[0]);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, prompt, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleFinalize = () => {
    if (selectedDesignBase64) {
      onComplete(selectedDesignBase64);
    }
  };

  const handleTabClick = (tab: MerchType) => {
      playSound('select');
      setActiveTab(tab);
      setShowNextStepNudge(false);
      setDesigns([]);
      setSelectedDesignBase64(null);
  }
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah Terakhir: Mockup Merchandise</h2>
        <p className="text-gray-400">
          Lihat gimana brand lo tampil di produk nyata. Pilih jenis merchandise, dan Mang AI bakal bikinin mockup realistisnya buat lo.
        </p>
      </div>
      
      <div className="flex flex-wrap border-b border-gray-700">
          {merchandiseTypes.map(merch => (
             <button 
                key={merch.id}
                onClick={() => handleTabClick(merch.id)} 
                className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === merch.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                {merch.name}
            </button>
          ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Textarea
          label="Prompt untuk Mockup (Bisa Diedit)"
          name="merchPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <div className="self-start">
            <Button type="submit" isLoading={isLoading} disabled={credits < GENERATION_COST || !prompt}>
                {`Bikinin Mockup ${merchandiseTypes.find(m=>m.id === activeTab)?.name}-nya! (${GENERATION_COST} Kredit)`}
            </Button>
        </div>
      </form>
      
      {error && <ErrorMessage message={error} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <h3 className="text-lg md:text-xl font-bold">Mockup Hasil Generate:</h3>
          <div className="flex justify-center w-full max-w-lg">
            <div 
                className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full aspect-square ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
              >
                <img src={designs[0]} alt={`Generated mockup for ${activeTab}`} className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
              </div>
          </div>
        </div>
      )}

      <div className="self-center mt-4 relative">
        {showNextStepNudge && (
            <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Satu langkah lagi!
            </CalloutPopup>
        )}
        <Button onClick={handleFinalize} disabled={!selectedDesignBase64 || isLoading} isLoading={isLoading}>
          Selesai & Lihat Brand Kit Lengkap &rarr;
        </Button>
      </div>
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Desain Merchandise untuk ${projectData.brandInputs?.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MerchandiseGenerator;
