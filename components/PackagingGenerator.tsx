
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePackagingDesign } from '../services/geminiService';
import { uploadImageFromBase64 } from '../services/storageService';
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
  logoUrl: string; // This is a Supabase URL
  onComplete: (packagingUrl: string) => void;
  userId: string;
  projectId: number;
}

const GENERATION_COST = 1;

const PackagingGenerator: React.FC<Props> = ({ persona, businessName, logoUrl, onComplete, userId, projectId }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState('');
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    const personaStyle = persona.kata_kunci.join(', ');
    const initialPrompt = `Take the provided logo image. Create a realistic mockup of a packaging design for a product from "${businessName}". Place the logo prominently. The brand personality is ${persona.deskripsi_singkat.toLowerCase()}. The style should be ${personaStyle}, modern, and clean. The final output should not be a flat vector illustration, but a commercial product mockup.`;
    setPrompt(initialPrompt);
  }, [persona, businessName]);

  useEffect(() => {
    if (designUrl && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [designUrl]);

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
    setDesignUrl(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
// FIX: `generatePackagingDesign` returns a string array. Access the first element for upload.
      const designBase64Array = await generatePackagingDesign(prompt, logoUrl);
      if (!designBase64Array || designBase64Array.length === 0) {
        throw new Error("AI tidak mengembalikan gambar kemasan.");
      }
      const uploadedUrl = await uploadImageFromBase64(designBase64Array[0], userId, projectId, 'packaging');
      
      await deductCredits(GENERATION_COST);
      setDesignUrl(uploadedUrl);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, logoUrl, credits, deductCredits, setShowOutOfCreditsModal, userId, projectId]);

  const handleContinue = () => {
    if (designUrl) {
      onComplete(designUrl);
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

      {designUrl && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Desain Hasil Generate:</h3>
          </div>
          <div className="flex justify-center w-full max-w-lg">
            <div
                className="bg-white rounded-lg p-2 aspect-[4/3] flex items-center justify-center shadow-lg w-full ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designUrl)}
            >
                <img src={designUrl} alt="Generated packaging design" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div className="self-center relative">
            {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Desain kemasan siap!
              </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!designUrl}>
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