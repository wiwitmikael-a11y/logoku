// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCaptions } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, GeneratedCaption } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';

interface Props {
  projectData: Partial<ProjectData>;
  onBack: () => void;
  onGoToDashboard: () => void;
  addXp: (amount: number) => Promise<void>;
}

const toneOptions = ["Promosi", "Informatif", "Menghibur", "Inspiratif", "Interaktif"];

const CaptionGenerator: React.FC<Props> = ({ projectData, onBack, onGoToDashboard, addXp }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;
  
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Promosi');
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (captions.length > 0 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [captions]);

  const handleSubmit = useCallback(async () => {
    if (!topic || !projectData.brandInputs || !projectData.selectedPersona) return;

    if (credits < 1) {
      setShowOutOfCreditsModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptions([]);
    playSound('start');

    try {
      await deductCredits(1);
      const result = await generateCaptions(
        projectData.brandInputs.businessName,
        projectData.selectedPersona,
        topic,
        tone
      );
      await addXp(10); // NEW: Award 10 XP for generating captions
      setCaptions(result);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, topic, tone, addXp, credits, deductCredits, setShowOutOfCreditsModal]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Generator Caption Sosmed</h2>
        <p className="text-gray-400">
          Butuh caption dadakan? Cukup kasih topiknya, dan Mang AI akan meracik 3 pilihan caption yang sesuai dengan persona brand "{projectData.selectedPersona?.nama_persona}". (+10 XP)
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
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!topic.trim() || credits < 1}>
            Buatin Captionnya, Mang! (1 Token)
          </Button>
           <Button onClick={onBack} variant="secondary">
            &larr; Kembali ke Ringkasan
          </Button>
        </div>


      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {captions.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 mt-4 scroll-mt-24">
          <h3 className="text-lg md:text-xl font-bold">Pilihan Caption Buat Lo:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {captions.map((item, index) => (
              <Card key={index} title={`Opsi ${index + 1}`}>
                 <div className="space-y-4">
                    <div className="relative">
                         <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10 selectable-text">{item.caption}</p>
                         <CopyButton textToCopy={item.caption} className="absolute top-2 right-2"/>
                    </div>
                    <div className="border-t border-gray-700 pt-3 relative">
                        <p className="text-indigo-300 text-xs break-words selectable-text pr-10">{item.hashtags.join(' ')}</p>
                        <CopyButton textToCopy={item.hashtags.join(' ')} className="absolute top-2 right-2"/>
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