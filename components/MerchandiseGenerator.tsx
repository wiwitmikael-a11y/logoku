

import React, { useState, useCallback, useEffect } from 'react';
import { generateMerchandiseMockup } from '../services/geminiService';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';

interface Props {
  logoPrompt: string;
  businessName: string;
  onComplete: (merchandiseUrl: string) => void;
}

type MerchType = 't-shirt' | 'mug' | 'tote-bag';

const merchandiseTypes: { id: MerchType; name: string; prompt: string }[] = [
  {
    id: 't-shirt',
    name: 'T-Shirt',
    prompt:
      'A realistic mockup of a plain colored t-shirt on a clean, neutral background. The t-shirt prominently features a logo for a brand named "{{businessName}}". The logo is described as: "{{logoPrompt}}". The photo is high-quality, commercial-style, showing the texture of the fabric.',
  },
  {
    id: 'mug',
    name: 'Mug',
    prompt:
      'A realistic mockup of a ceramic coffee mug on a simple table. The mug has a logo printed on it for a brand called "{{businessName}}". The logo is described as: "{{logoPrompt}}". The lighting is soft and natural, product photography style.',
  },
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    prompt:
      'A realistic mockup of a canvas tote bag hanging against a clean wall. The tote bag has a logo printed in the center for a company named "{{businessName}}". The logo is described as: "{{logoPrompt}}". The image looks like a professional product photo for an online store.',
  },
];

const MerchandiseGenerator: React.FC<Props> = ({ logoPrompt, businessName, onComplete }) => {
  const [activeTab, setActiveTab] = useState<MerchType>('t-shirt');
  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignUrl, setSelectedDesignUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    const currentMerch = merchandiseTypes.find(m => m.id === activeTab);
    if (currentMerch) {
      const newPrompt = currentMerch.prompt
        .replace('{{businessName}}', businessName)
        .replace('{{logoPrompt}}', logoPrompt);
      setPrompt(newPrompt);
    }
  }, [activeTab, businessName, logoPrompt]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignUrl(null);
    playSound('start');

    try {
      const results = await generateMerchandiseMockup(prompt);
      setDesigns(results);
      if (results.length > 0) {
        setSelectedDesignUrl(results[0]); // Auto-select the first (and only) design
      }
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const handleContinue = () => {
    if (selectedDesignUrl) {
      onComplete(selectedDesignUrl);
    }
  };

  const handleTabClick = (tab: MerchType) => {
      playSound('select');
      setActiveTab(tab);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 7: Mockup Merchandise Mang AI</h2>
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
          label="Prompt untuk Mockup"
          name="merchPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
        />
        <div className="self-start">
            <Button type="submit" isLoading={isLoading}>
                {`Bikinin Mockup ${merchandiseTypes.find(m=>m.id === activeTab)?.name}-nya!`}
            </Button>
        </div>
      </form>
      
      {error && <ErrorMessage message={error} />}

      {designs.length > 0 && (
        <div className="flex flex-col gap-6 items-center">
            <h3 className="text-xl font-bold">Mockup Hasil Generate:</h3>
          <div className="flex justify-center w-full max-w-sm">
            <div 
                className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full aspect-square ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
              >
                <img src={designs[0]} alt={`Generated mockup for ${activeTab}`} className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
              </div>
          </div>
        </div>
      )}

      <div className="self-center mt-4">
        <Button onClick={handleContinue} disabled={!selectedDesignUrl}>
          Selesai & Lihat Brand Kit Lengkap &rarr;
        </Button>
      </div>
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Mockup merchandise untuk ${businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MerchandiseGenerator;