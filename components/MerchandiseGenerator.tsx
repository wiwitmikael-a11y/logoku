import React, { useState, useCallback, useEffect } from 'react';
import { generateMerchandiseMockup } from '../services/geminiService';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';

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

    try {
      const results = await generateMerchandiseMockup(prompt);
      setDesigns(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const handleContinue = () => {
    if (selectedDesignUrl) {
      onComplete(selectedDesignUrl);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 7: Mockup Merchandise AI</h2>
        <p className="text-gray-400">
          Lihat gimana brand lo tampil di produk nyata. Pilih jenis merchandise, dan AI bakal bikinin mockup realistisnya buat lo.
        </p>
      </div>
      
      <div className="flex flex-wrap border-b border-gray-700">
          {merchandiseTypes.map(merch => (
             <button 
                key={merch.id}
                onClick={() => setActiveTab(merch.id)} 
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
            <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Spinner /> Lagi Bikin Mockup...</> : `Generate Desain ${merchandiseTypes.find(m=>m.id === activeTab)?.name}`}
            </Button>
        </div>
      </form>
      
      {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}

      {designs.length > 0 && (
        <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold">Pilih Mockup Favorit Lo:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {designs.map((url, index) => (
              <div 
                key={index} 
                className={`bg-gray-700 rounded-lg p-2 flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer aspect-square ${selectedDesignUrl === url ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : 'hover:scale-105'}`}
                onClick={() => setSelectedDesignUrl(url)}
              >
                <img src={url} alt={`Generated mockup ${index + 1}`} className="object-contain rounded-md max-w-full max-h-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="self-center mt-4">
        <Button onClick={handleContinue} disabled={!selectedDesignUrl}>
          Selesai & Lihat Brand Kit Lengkap &rarr;
        </Button>
      </div>
    </div>
  );
};

export default MerchandiseGenerator;
