import React, { useState, useCallback, useEffect } from 'react';
import { generatePackagingDesign } from '../services/geminiService';
import { playSound } from '../services/soundService';
import type { BrandPersona } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';

interface Props {
  persona: BrandPersona;
  businessName: string;
  onComplete: (packagingUrl: string) => void;
  credits: number;
  onDeductCredits: (cost: number) => boolean;
}

const GENERATION_COST = 1;

const PackagingGenerator: React.FC<Props> = ({ persona, businessName, onComplete, credits, onDeductCredits }) => {
  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignUrl, setSelectedDesignUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    // Auto-generate a prompt based on the persona
    const personaStyle = persona.kata_kunci.join(', ');
    const initialPrompt = `packaging design for a product from "${businessName}". The brand personality is ${persona.deskripsi_singkat.toLowerCase()}. Style should be ${personaStyle}, modern, clean, commercially viable.`;
    setPrompt(initialPrompt);
  }, [persona, businessName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !onDeductCredits(GENERATION_COST)) return;

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignUrl(null);
    playSound('start');

    try {
      const results = await generatePackagingDesign(prompt);
      setDesigns(results);
      if (results.length > 0) {
        setSelectedDesignUrl(results[0]); // Auto-select the first (and only) design
      }
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, onDeductCredits]);

  const handleContinue = () => {
    if (selectedDesignUrl) {
      onComplete(selectedDesignUrl);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 6: Desain Kemasan Lo</h2>
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
        <div className="flex flex-col gap-6 items-center">
          <div>
            <h3 className="text-xl font-bold mb-2">Desain Hasil Generate:</h3>
          </div>
          <div className="flex justify-center w-full max-w-lg">
            <div
                className="bg-white rounded-lg p-2 aspect-[4/3] flex items-center justify-center shadow-lg w-full ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
            >
                <img src={designs[0]} alt="Generated packaging design" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div className="self-center">
            <Button onClick={handleContinue} disabled={!selectedDesignUrl}>
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