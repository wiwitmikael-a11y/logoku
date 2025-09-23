import React, { useState, useCallback, useEffect } from 'react';
import { generatePackagingDesign } from '../services/geminiService';
import type { BrandPersona } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';

interface Props {
  persona: BrandPersona;
  businessName: string;
  onComplete: (packagingUrl: string) => void;
}

const PackagingGenerator: React.FC<Props> = ({ persona, businessName, onComplete }) => {
  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignUrl, setSelectedDesignUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-generate a prompt based on the persona
    const personaStyle = persona.kata_kunci.join(', ');
    const initialPrompt = `packaging design for a product from "${businessName}". The brand personality is ${persona.deskripsi_singkat.toLowerCase()}. Style should be ${personaStyle}, modern, clean, commercially viable.`;
    setPrompt(initialPrompt);
  }, [persona, businessName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignUrl(null);

    try {
      const results = await generatePackagingDesign(prompt);
      setDesigns(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.');
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
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? <><Spinner /> Lagi Bikin...</> : 'Generate Desain'}
          </Button>
        </div>
      </form>

      {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}

      {designs.length > 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Desain Hasil Generate:</h3>
            <p className="text-gray-400">Klik gambar buat milih desain kemasan lo.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {designs.map((url, index) => (
              <div
                key={index}
                className={`bg-gray-700 rounded-lg p-2 aspect-[4/3] flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${selectedDesignUrl === url ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : 'hover:scale-105'}`}
                onClick={() => setSelectedDesignUrl(url)}
              >
                <img src={url} alt="Generated packaging design" className="object-contain rounded-md max-w-full max-h-full" />
              </div>
            ))}
          </div>
          <div className="self-center">
            <Button onClick={handleContinue} disabled={!selectedDesignUrl}>
              Lanjut ke Merchandise &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingGenerator;