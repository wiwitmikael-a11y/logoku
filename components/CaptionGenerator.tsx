// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCaptions } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
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
  const { notifyPetOfActivity } = useAIPet();
  const credits = profile?.credits ?? 0;
  
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Promosi');
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (captions.length > 0 && resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [captions]);

  useEffect(() => {
    const interval = setInterval(() => notifyPetOfActivity('generating_captions'), 3000);
    return () => clearInterval(interval);
  }, [notifyPetOfActivity]);

  const handleSubmit = useCallback(async () => {
    if (!topic || !projectData.brandInputs || !projectData.selectedPersona) return;
    if (credits < 1) { setShowOutOfCreditsModal(true); return; }

    setIsLoading(true);
    setError(null);
    setCaptions([]);
    playSound('start');

    try {
      await deductCredits(1);
      const result = await generateCaptions(projectData.brandInputs.businessName, projectData.selectedPersona, topic, tone);
      await addXp(10);
      setCaptions(result);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, topic, tone, addXp, credits, deductCredits, setShowOutOfCreditsModal]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Generator Caption Sosmed</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Butuh caption dadakan? Cukup kasih topiknya, dan Mang AI akan meracik 3 pilihan caption yang sesuai dengan persona brand "{projectData.selectedPersona?.nama_persona}".</p>
      </div>

      <Card title="Konfigurasi Caption" className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Textarea label="Topik Postingan" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth: Lagi ada promo beli 1 gratis 1 untuk semua minuman kopi." rows={4} className="md:col-span-2"/>
          <div className="flex flex-col gap-2">
              <label htmlFor="tone" className="block text-sm font-medium text-text-muted">Nada Bicara</label>
              <select id="tone" name="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 text-text-body bg-surface border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-splash/50 focus:border-splash transition-colors">
                  {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
          </div>
        </div>
      </Card>
      
       <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!topic.trim() || credits < 1}>Buatin Captionnya, Mang! (1 Token, +10 XP)</Button>
           <Button onClick={onBack} variant="secondary">&larr; Kembali ke Brand Hub</Button>
        </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {captions.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 mt-4 scroll-mt-24">
          <h3 className="text-3xl font-bold text-center text-text-header">Pilihan Caption Buat Lo:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {captions.map((item, index) => (
              <Card key={index} title={`Opsi ${index + 1}`} className="animate-item-appear" style={{animationDelay: `${index*100}ms`}}>
                 <div className="space-y-4">
                    <div className="relative">
                         <p className="text-text-body whitespace-pre-wrap text-sm pr-10 selectable-text">{item.caption}</p>
                         <CopyButton textToCopy={item.caption} className="absolute top-0 right-0"/>
                    </div>
                    <div className="border-t border-border-main pt-3 relative">
                        <p className="text-primary text-xs break-words selectable-text pr-10">{item.hashtags.join(' ')}</p>
                        <CopyButton textToCopy={item.hashtags.join(' ')} className="absolute top-0 right-0"/>
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
