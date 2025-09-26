import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePackagingDesign } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { BrandPersona } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  persona: BrandPersona;
  businessName: string;
  onComplete: (packagingBase64: string) => void;
}

const GENERATION_COST = 1;

const PackagingGenerator: React.FC<Props> = ({ persona, businessName, onComplete }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]); // Will hold Base64
  const [selectedDesignBase64, setSelectedDesignBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    // Auto-generate a prompt based on the persona
    const personaStyle = persona.kata_kunci.join(', ');
    const initialPrompt = `A simple flat vector illustration of a packaging design for a product from "${businessName}". The brand personality is ${persona.deskripsi_singkat.toLowerCase()}. Style should be ${personaStyle}, modern, clean, minimalist. Not a photograph.`;
    setPrompt(initialPrompt);
  }, [persona, businessName]);

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
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignBase64(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const results = await generatePackagingDesign(prompt); // Returns Base64
      
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      setSelectedDesignBase64(results[0]);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleContinue = () => {
    if (selectedDesignBase64) {
      onComplete(selectedDesignBase64);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 8: Desain Kemasan Lo</h2>
        <p className="text-gray-400">Sentuhan terakhir! Berdasarkan persona brand lo, kita udah siapin prompt buat desain kemasan produk lo. Edit kalo perlu, terus generate konsepnya.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea
          label="Prompt Deskripsi Kemasan"
          name="packagingPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="cth: Kotak minimalis untuk biji kopi, warna earth tone..."
          rows={4}
        />
        <div className="self-start">
          <Button type="submit" isLoading={isLoading} disabled={!prompt.trim() || credits < GENERATION_COST}>
            Bungkus Desainnya, Mang AI! ({GENERATION_COST} Kredit)
          </Button>
        </div>
      </form>

      {error && <ErrorMessage message={error} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Desain Hasil Generate:</h3>
          </div>
          <div className="flex justify-center w-full max-w-lg">
            <div
                className="bg-white rounded-lg p-2 aspect-[4/3] flex items-center justify-center shadow-lg w-full ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
            >
                <img src={designs[0]} alt="Generated packaging design" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div className="self-center relative">
            {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Desain kemasan siap!
              </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!selectedDesignBase64}>
              Lanjut ke Merchandise &rarr;
            </Button>
          </div>
        </div>
      )}

      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Desain kemasan untuk ${businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PackagingGenerator;