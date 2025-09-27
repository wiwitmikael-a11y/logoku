

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePrintMedia } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, PrintMediaAssets } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Input from './common/Input';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (printMediaAssets: PrintMediaAssets) => void;
  isFinalizing: boolean;
}

type MediaTab = 'roll_banner' | 'banner';
const GENERATION_COST = 1;

const PrintMediaGenerator: React.FC<Props> = ({ projectData, onComplete, isFinalizing }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  const [activeTab, setActiveTab] = useState<MediaTab>('roll_banner');
  const [designs, setDesigns] = useState<string[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<PrintMediaAssets>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [bannerInfo, setBannerInfo] = useState({
    headline: 'SEGERA DIBUKA!',
    subheadline: `Nantikan ${projectData.brandInputs?.businessName} di kota Anda!`,
  });
  const [rollBannerInfo, setRollBannerInfo] = useState({
    headline: `Selamat Datang di ${projectData.brandInputs?.businessName}`,
    body: '• Kopi Berkualitas\n• Tempat Nyaman\n• Harga Terjangkau',
    contact: `@${businessHandle}`,
  });

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);
  
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (designs.length > 0 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setShowNextStepNudge(false);
    playSound('start');

    const { brandInputs, selectedPersona, selectedLogoUrl } = projectData;

    if (!brandInputs || !selectedPersona || !selectedLogoUrl) {
        setError("Data project (logo/persona) tidak lengkap.");
        setIsLoading(false);
        playSound('error');
        return;
    }

    try {
      let prompt = '';
      const colors = selectedPersona.palet_warna_hex.join(', ');
      const style = selectedPersona.kata_kunci.join(', ');

      // FIX: Added detailed prompt generation logic for each tab.
      if (activeTab === 'roll_banner') {
          prompt = `Take the provided logo image. Create a professional, clean, flat graphic design for a vertical roll-up banner (aspect ratio 9:16). Do NOT create a mockup, create the final print-ready design.
          - Brand Name: ${brandInputs.businessName}
          - Style: ${style}, modern, eye-catching.
          - Colors: Use this palette: ${colors}.
          - Content to include: Headline at top: "${rollBannerInfo.headline}", Body text in middle: "${rollBannerInfo.body}", Contact info at bottom: "${rollBannerInfo.contact}".
          The design must be highly legible. Place the logo prominently near the top. Ensure all text is clear.`;
      } else if (activeTab === 'banner') {
          prompt = `Take the provided logo image. Create a professional, clean, flat graphic design for a horizontal outdoor banner (spanduk, aspect ratio 3:1). Do NOT create a mockup, create the final print-ready design.
          - Brand Name: ${brandInputs.businessName}
          - Style: ${style}, bold, eye-catching.
          - Colors: Use this palette: ${colors}.
          - Content to include: Headline (very large): "${bannerInfo.headline}", Sub-headline (smaller): "${bannerInfo.subheadline}".
          The design must be highly legible from a distance. Place the logo prominently. Ensure all text is clear.`;
      }

      // FIX: Correctly call generatePrintMedia with the generated prompt and the logo's base64 data.
      const logoBase64 = await fetchImageAsBase64(selectedLogoUrl);
      const results = await generatePrintMedia(prompt, logoBase64);
      
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      
      if (activeTab === 'roll_banner') {
        setGeneratedAssets(prev => ({ ...prev, rollBannerUrl: results[0] }));
      } else if (activeTab === 'banner') {
        setGeneratedAssets(prev => ({ ...prev, bannerUrl: results[0] }));
      }

      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal, activeTab, rollBannerInfo, bannerInfo]);

  const handleFinalize = () => {
    onComplete(generatedAssets);
  };

  const handleTabClick = (tab: MediaTab) => {
      playSound('select');
      setActiveTab(tab);
      setShowNextStepNudge(false);
      setDesigns([]);
  }
  
  const renderForm = () => {
      switch(activeTab) {
          case 'roll_banner':
             return (
                 <div className="grid grid-cols-1 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Headline (di bagian atas)" name="headline" value={rollBannerInfo.headline} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} />
                    <Textarea label="Isi Konten (bisa pakai bullet point)" name="body" value={rollBannerInfo.body} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} rows={4} />
                    <Input label="Info Kontak (di bagian bawah)" name="contact" value={rollBannerInfo.contact} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} placeholder="cth: @namabisnislo" />
                </div>
            );
          case 'banner':
            return (
                 <div className="grid grid-cols-1 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Headline (Teks Paling Besar)" name="headline" value={bannerInfo.headline} onChange={(e) => handleInfoChange(e, setBannerInfo)} placeholder="cth: GRAND OPENING!" />
                    <Input label="Sub-headline (Teks Pendukung)" name="subheadline" value={bannerInfo.subheadline} onChange={(e) => handleInfoChange(e, setBannerInfo)} placeholder="cth: Diskon 50% Semua Item" />
                </div>
            );
      }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 9: Studio Media Cetak Mang AI</h2>
        <p className="text-gray-400">
          Saatnya bikin amunisi promosi! Pilih jenis media, isi infonya, dan Mang AI bakal bikinin desain siap cetak buat lo.
        </p>
      </div>
      
      <div className="flex flex-wrap border-b border-gray-700">
          <button onClick={() => handleTabClick('roll_banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'roll_banner' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Roll Banner (Vertikal)</button>
          <button onClick={() => handleTabClick('banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'banner' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Spanduk (Horizontal)</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {renderForm()}
        <div className="self-start">
            <Button type="submit" isLoading={isLoading} disabled={credits < GENERATION_COST}>
                {`Bikinin Desain ${activeTab === 'roll_banner' ? 'Roll Banner' : 'Spanduk'}! (${GENERATION_COST} Kredit)`}
            </Button>
        </div>
      </form>
      
      {error && <ErrorMessage message={error} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <h3 className="text-lg md:text-xl font-bold">Desain Hasil Generate:</h3>
          <div className="flex justify-center w-full max-w-lg">
            <div 
                className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full aspect-video ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
              >
                <img src={designs[0]} alt={`Generated mockup for ${activeTab}`} className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
              </div>
          </div>
        </div>
      )}

      <div className="self-center mt-4 relative">
        {showNextStepNudge && (
            <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Satu langkah lagi!
            </CalloutPopup>
        )}
        <Button onClick={handleFinalize} disabled={Object.keys(generatedAssets).length === 0 || isFinalizing} isLoading={isFinalizing}>
          {isFinalizing ? 'Finalisasi & Simpan Project...' : 'Selesai & Lihat Brand Kit Lengkap &rarr;'}
        </Button>
      </div>
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Desain Media Cetak untuk ${projectData.brandInputs?.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PrintMediaGenerator;
