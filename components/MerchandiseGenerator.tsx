import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateMerchandiseMockup } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import type { ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import Card from './common/Card';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (merchandiseUrl: string) => void;
  onGoToDashboard: () => void;
}

type MerchType = 't-shirt' | 'mug' | 'tote-bag';
const GENERATION_COST = 1;

const merchandiseTypes: { id: MerchType; name: string; prompt: string }[] = [
  { id: 't-shirt', name: 'T-Shirt', prompt: 'Take the provided logo image. Create a realistic mockup of a plain colored t-shirt on a clean, neutral background. The t-shirt prominently features the logo. The photo is high-quality, commercial-style, showing the texture of the fabric.' },
  { id: 'mug', name: 'Mug', prompt: 'Take the provided logo image. Create a realistic mockup of a white ceramic coffee mug on a clean, neutral background. The mug prominently features the logo. The photo is high-quality, commercial-style.' },
  { id: 'tote-bag', name: 'Tote Bag', prompt: 'Take the provided logo image. Create a realistic mockup of a simple canvas tote bag on a clean, neutral background. The tote bag prominently features the logo. The photo is high-quality, commercial-style.' },
];

const MerchandiseGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState(merchandiseTypes[0].prompt);
  const [selectedMerchType, setSelectedMerchType] = useState<MerchType>('t-shirt');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = merchandiseTypes.find(m => m.id === selectedMerchType);
    if (selected) {
      setPrompt(selected.prompt);
    }
  }, [selectedMerchType]);

  useEffect(() => {
    if (designs.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    if (!prompt || !projectData.selectedLogoUrl) { setError("Data logo tidak ditemukan."); playSound('error'); return; }

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesign(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const logoBase64 = await fetchImageAsBase64(projectData.selectedLogoUrl);
      const results = await generateMerchandiseMockup(prompt, logoBase64);
      if (!(await deductCredits(GENERATION_COST))) return;
      setDesigns(results);
      setSelectedDesign(results[0]); // Auto-select the first result
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, projectData, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleContinue = () => {
    if (selectedDesign) {
      onComplete(selectedDesign);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 10: Mockup Merchandise</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Langkah terakhir! Mari kita lihat gimana logo lo keliatan di merchandise. Mang AI akan membuatkan mockup realistis buat T-Shirt, Mug, atau Tote Bag.</p>
      </div>

      <Card title="Konfigurasi Mockup" className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="merchType" className="block mb-1.5 text-sm font-medium text-text-muted">Pilih Tipe Merchandise</label>
              <select id="merchType" name="merchType" value={selectedMerchType} onChange={(e) => setSelectedMerchType(e.target.value as MerchType)} className="w-full px-3 py-2 text-text-body bg-surface border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors">
                {merchandiseTypes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
            <p className="text-sm text-text-muted md:pt-8">Pilih jenis produk, dan Mang AI akan otomatis membuatkan prompt terbaik untuk mockup-nya.</p>
          </div>
          <Textarea label="Prompt Mockup (Sudah Otomatis, Bisa Diedit)" name="merchPrompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} />
          <div className="pt-4 border-t border-border-main">
            <Button type="submit" isLoading={isLoading} disabled={!prompt.trim() || credits < GENERATION_COST}>Buatin Mockup-nya, Mang! ({GENERATION_COST} Token)</Button>
          </div>
        </form>
      </Card>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}
      
      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-text-header">Hasil Mockup Merchandise:</h3>
          <div className="flex justify-center w-full max-w-lg animate-item-appear">
            <div className="bg-surface rounded-lg p-2 aspect-square flex items-center justify-center shadow-lg w-full border-2 border-primary ring-4 ring-primary/20 cursor-pointer group" onClick={() => setModalImageUrl(designs[0])}>
              <img src={designs[0]} alt="Generated merchandise mockup" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div className="self-center relative">
            {showNextStepNudge && (<CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Mantap! Ini langkah terakhir!</CalloutPopup>)}
            <Button onClick={handleContinue} disabled={!selectedDesign} size="large">Selesai & Finalisasi Project! &rarr;</Button>
          </div>
        </div>
      )}

      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText={`Mockup untuk ${projectData.brandInputs?.businessName}`} onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default MerchandiseGenerator;
