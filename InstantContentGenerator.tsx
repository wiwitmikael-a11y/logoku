// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCaptions, generateSocialMediaPostImage } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import { useUserActions } from '../contexts/UserActionsContext';
import type { ProjectData, GeneratedCaption } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';
import LoadingMessage from './common/LoadingMessage';

interface Props {
  projectData: Partial<ProjectData>;
  onBack: () => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 2; // 1 for image, 1 for captions

interface GeneratedContent {
    imageUrl: string;
    captions: GeneratedCaption[];
}

const InstantContentGenerator: React.FC<Props> = ({ projectData, onBack, onGoToDashboard }) => {
  const { profile } = useAuth();
  const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
  const { petState } = useAIPet();
  const credits = profile?.credits ?? 0;

  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedContent && resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [generatedContent]);

  const handleSubmit = useCallback(async () => {
    const { brandInputs, selectedPersona } = projectData;
    if (!topic || !brandInputs || !selectedPersona) return;
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    playSound('start');

    try {
      if (!(await deductCredits(GENERATION_COST))) return;

      const [imageResult, captionsResult] = await Promise.all([
        generateSocialMediaPostImage(topic, selectedPersona.kata_kunci),
        generateCaptions(brandInputs.businessName, selectedPersona, topic, "Promosi", petState)
      ]);
      if (!imageResult || imageResult.length === 0) throw new Error("Mang AI gagal membuat gambar.");
      
      await addXp(75);
      setGeneratedContent({ imageUrl: imageResult[0], captions: captionsResult });
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, topic, credits, deductCredits, setShowOutOfCreditsModal, addXp, petState]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Generator Konten Instan</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Ubah ide jadi 1 paket konten siap posting (1 gambar + 3 caption) dalam sekejap! Cukup kasih topik, dan Mang AI akan meracik semuanya sesuai brand "{projectData.selectedPersona?.nama_persona}" lo.</p>
      </div>

      <Card title="Ide Konten">
        <Textarea label="Ide atau Topik Postingan Hari Ini" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth: Promo Beli 1 Gratis 1 Kopi Susu, atau 'Selamat Hari Senin, tetap semangat!'" rows={3}/>
      </Card>
      
       <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!topic.trim() || credits < GENERATION_COST}>Buatin Kontennya, Mang! ({GENERATION_COST} Token, +75 XP)</Button>
           <Button onClick={onBack} variant="secondary">&larr; Kembali ke Brand Hub</Button>
        </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}
      {isLoading && !generatedContent && <div className="flex justify-center items-center p-8"><LoadingMessage /></div>}

      {generatedContent && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 pt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
            <div>
                <h4 className="font-bold text-accent">Peringatan Penyimpanan Lokal!</h4>
                <p className="text-sm text-accent/80 mt-1">Konten ini hanya sementara. Segera unduh gambar dan salin caption-nya. <strong>Konten akan hilang jika lo me-refresh atau meninggalkan halaman ini.</strong></p>
            </div>
        </div>
      )}

      {generatedContent && (
        <div ref={resultsRef} className="flex flex-col gap-8 mt-4 scroll-mt-24">
          <h3 className="text-3xl font-bold text-center text-text-header">Konten Siap Posting Buat Lo:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4 animate-item-appear">
                <Card title="Visual Konten">
                  <div className="bg-background rounded-lg p-2 aspect-square flex items-center justify-center w-full cursor-pointer group" onClick={() => setModalImageUrl(generatedContent.imageUrl)}>
                      <img src={generatedContent.imageUrl} alt="Generated content visual" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
                  </div>
                </Card>
            </div>
            <div className="flex flex-col gap-4">
                <h4 className="font-semibold text-text-header text-center lg:text-left">Pilihan Caption:</h4>
                {generatedContent.captions.map((item, index) => (
                  <Card key={index} title={`Opsi Caption ${index + 1}`} className="animate-item-appear" style={{animationDelay: `${100 * index}ms`}}>
                     <div className="space-y-3">
                        <div className="relative"><p className="text-text-body whitespace-pre-wrap text-sm pr-10 selectable-text">{item.caption}</p><CopyButton textToCopy={item.caption} className="absolute top-0 right-0"/></div>
                        <div className="relative border-t border-border-main pt-3"><p className="text-primary text-xs break-words pr-10 selectable-text">{item.hashtags.join(' ')}</p><CopyButton textToCopy={item.hashtags.join(' ')} className="absolute top-0 right-0"/></div>
                     </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText="Preview Visual Konten" onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default InstantContentGenerator;
