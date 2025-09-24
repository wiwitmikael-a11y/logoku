import React, { useState, useCallback } from 'react';
import { generateCaptions } from '../services/geminiService';
import { playSound } from '../services/soundService';
import type { ProjectData, GeneratedCaption } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';

interface Props {
  projectData: Partial<ProjectData>;
  onBack: () => void;
}

const toneOptions = ["Promosi", "Informatif", "Menghibur", "Inspiratif", "Interaktif"];

const CaptionGenerator: React.FC<Props> = ({ projectData, onBack }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Promosi');
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!topic || !projectData.brandInputs || !projectData.selectedPersona) return;

    setIsLoading(true);
    setError(null);
    setCaptions([]);
    playSound('start');

    try {
      const result = await generateCaptions(
        projectData.brandInputs.businessName,
        projectData.selectedPersona,
        topic,
        tone
      );
      setCaptions(result);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, topic, tone]);

  const copyToClipboard = (text: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
    // TODO: Add a small notification "Copied!"
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Generator Caption Sosmed</h2>
        <p className="text-gray-400">
          Bikin caption keren buat Instagram, TikTok, atau platform lain pake persona brand "{projectData.selectedPersona?.nama_persona}". Cukup kasih topiknya!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <Textarea
          label="Topik Postingan"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="cth: Lagi ada promo beli 1 gratis 1 untuk semua minuman kopi."
          rows={4}
          className="md:col-span-2"
        />
        <div className="flex flex-col gap-2">
            <label htmlFor="tone" className="block text-sm font-medium text-gray-300">Nada Bicara</label>
            <select
                id="tone"
                name="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
                {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
      </div>
      
       <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!topic.trim()}>
            Buatin Captionnya, Mang!
          </Button>
           <Button onClick={onBack} variant="secondary">
            &larr; Kembali ke Dashboard
          </Button>
        </div>


      {error && <ErrorMessage message={error} />}

      {captions.length > 0 && (
        <div className="flex flex-col gap-6 mt-4">
          <h3 className="text-xl font-bold">Pilihan Caption Buat Lo:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {captions.map((item, index) => (
              <Card key={index} title={`Opsi ${index + 1}`}>
                 <div className="space-y-4">
                    <div className="relative">
                         <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10">{item.caption}</p>
                         <button 
                            onClick={() => copyToClipboard(item.caption)} 
                            title="Salin caption" 
                            className="absolute top-0 right-0 p-1 text-gray-400 hover:text-indigo-400 transition-colors"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                        </button>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                        <p className="text-indigo-300 text-xs break-words">{item.hashtags.join(' ')}</p>
                    </div>
                 </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptionGenerator;
