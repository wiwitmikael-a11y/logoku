import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (printMediaAssets: PrintMediaAssets) => void;
  isFinalizing: boolean;
}

type MediaTab = 'business_card' | 'banner';
const GENERATION_COST = 1;

const PrintMediaGenerator: React.FC<Props> = ({ projectData, onComplete, isFinalizing }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  const [activeTab, setActiveTab] = useState<MediaTab>('business_card');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignBase64, setSelectedDesignBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // State for inputs
  const [cardInfo, setCardInfo] = useState({
    name: 'Rangga P. H.',
    title: 'Owner',
    phone: '0812-3456-7890',
    email: `halo@${businessHandle}.com`,
    website: `www.${businessHandle}.com`,
  });
  const [bannerInfo, setBannerInfo] = useState({
    headline: 'SEGERA DIBUKA!',
    subheadline: `Nantikan ${projectData.brandInputs?.businessName} di kota Anda!`,
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
    setSelectedDesignBase64(null);
    setShowNextStepNudge(false);
    playSound('start');

    // FIX: Correctly construct the prompt string and call generatePrintMedia with the right arguments.
    const { brandInputs, selectedPersona, selectedLogoUrl } = projectData;
    if (!brandInputs || !selectedPersona || !selectedLogoUrl) {
        setError("Data project (logo/persona) tidak lengkap.");
        setIsLoading(false);
        return;
    }

    try {
      let prompt = '';
      const colors = selectedPersona.palet_warna_hex.join(', ');
      const style = selectedPersona.kata_kunci.join(', ');

      if (activeTab === 'business_card') {
          prompt = `Take the provided logo image. Create a professional, clean, flat graphic design for a business card. Do NOT create a mockup, create the final print-ready design (aspect ratio 3.5:2).
          - Brand Name: ${brandInputs.businessName}
          - Style: ${style}, minimalist, professional.
          - Colors: Use this palette: ${colors}.
          - Content to include: Name: ${cardInfo.name}, Title: ${cardInfo.title}, Phone: ${cardInfo.phone}, Email: ${cardInfo.email}, Website: ${cardInfo.website}.
          The design must be clean, legible, and follow the brand's persona. Place the logo appropriately. Ensure all text is clear.`;
      } else if (activeTab === 'banner') {
          prompt = `Take the provided logo image. Create a professional, clean, flat graphic design for a horizontal outdoor banner (spanduk, aspect ratio 16:9). Do NOT create a mockup, create the final print-ready design.
          - Brand Name: ${brandInputs.businessName}
          - Style: ${style}, bold, eye-catching.
          - Colors: Use this palette: ${colors}.
          - Content to include: Headline (very large): "${bannerInfo.headline}", Sub-headline (smaller): "${bannerInfo.subheadline}".
          The design must be highly legible from a distance. Place the logo prominently. Ensure all text is clear.`;
      }

      const results = await generatePrintMedia(prompt, selectedLogoUrl);
      
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      setSelectedDesignBase64(results[0]);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal, activeTab, cardInfo, bannerInfo]);

  const handleFinalize = () => {
    if (selectedDesignBase64) {
      const assets: PrintMediaAssets = {};
      if(activeTab === 'business_card') assets.businessCardUrl = selectedDesignBase64;
      if(activeTab === 'banner') assets.bannerUrl = selectedDesignBase64;
      onComplete(assets);
    }
  };

  const handleTabClick = (tab: MediaTab) => {
      playSound('select');
      setActiveTab(tab);
      setShowNextStepNudge(false);
      setDesigns([]);
      setSelectedDesignBase64(null);
  }
  
  const renderForm = () => {
      switch(activeTab) {
          case 'business_card':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Nama Lengkap" name="name" value={cardInfo.name} onChange={(e) => handleInfoChange(e, setCardInfo)} />
                    <Input label="Jabatan/Title" name="title" value={cardInfo.title} onChange={(e) => handleInfoChange(e, setCardInfo)} />
                    <Input label="Nomor Telepon" name="phone" value={cardInfo.phone} onChange={(e) => handleInfoChange(e, setCardInfo)} />
                    <Input label="Alamat Email" name="email" value={cardInfo.email} onChange={(e) => handleInfoChange(e, setCardInfo)} />
                    <Input className="md:col-span-2" label="Website / Social Media" name="website" value={cardInfo.website} onChange={(e) => handleInfoChange(e, setCardInfo)} />
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
          <button onClick={() => handleTabClick('business_card')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'business_card' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Kartu Nama</button>
          <button onClick={() => handleTabClick('banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'banner' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Spanduk</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {renderForm()}
        <div className="self-start">
            <Button type="submit" isLoading={isLoading} disabled={credits < GENERATION_COST}>
                {`Bikinin Desain ${activeTab === 'business_card' ? 'Kartu Nama' : 'Spanduk'}! (${GENERATION_COST} Kredit)`}
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
        <Button onClick={handleFinalize} disabled={!selectedDesignBase64 || isFinalizing} isLoading={isFinalizing}>
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