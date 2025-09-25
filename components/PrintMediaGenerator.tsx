import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generatePrintMedia } from '../services/geminiService';
import { uploadImageFromBase64 } from '../services/storageService';
import { playSound } from '../services/soundService';
import { useAuth, STORAGE_QUOTA_KB } from '../contexts/AuthContext';
import type { ProjectData, BrandInputs, PrintMediaAssets } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup'; // Import the new component

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { assets: PrintMediaAssets, inputs: Pick<BrandInputs, 'contactInfo' | 'flyerContent' | 'bannerContent' | 'rollBannerContent'> }) => void;
  userId: string;
  projectId: number;
}

type MediaTab = 'business_card' | 'flyer' | 'banner' | 'roll_banner';
const GENERATION_COST = 1;

const PrintMediaGenerator: React.FC<Props> = ({ projectData, onComplete, userId, projectId }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [activeTab, setActiveTab] = useState<MediaTab>('business_card');
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';
  
  // States
  const [cardInfo, setCardInfo] = useState({
    name: 'Rangga',
    title: 'Owner',
    phone: '0812-3456-7890',
    email: `halo@${businessHandle}.com`,
    website: `www.${businessHandle}.com`,
  });
  const [flyerInfo, setFlyerInfo] = useState({
    headline: 'Diskon Grand Opening 50%!',
    body: 'Nikmati semua produk kopi kami dengan setengah harga selama minggu pertama. Tunjukkan flyer ini untuk mendapatkan penawaran.',
    cta: 'Kunjungi Kami Sekarang!',
  });
  const [bannerInfo, setBannerInfo] = useState({
    headline: 'SEGERA DIBUKA!',
    subheadline: `Nantikan ${projectData.brandInputs?.businessName} di kota Anda!`,
  });
  const [rollBannerInfo, setRollBannerInfo] = useState({
    headline: `Selamat Datang di ${projectData.brandInputs?.businessName}`,
    body: '• Kopi Berkualitas\n• Tempat Nyaman\n• Harga Terjangkau',
    contact: `@${businessHandle}`,
  });

  const [cardDesigns, setCardDesigns] = useState<string[]>([]);
  const [flyerDesigns, setFlyerDesigns] = useState<string[]>([]);
  const [bannerDesigns, setBannerDesigns] = useState<string[]>([]);
  const [rollBannerDesigns, setRollBannerDesigns] = useState<string[]>([]);

  const [selectedCardUrl, setSelectedCardUrl] = useState<string | null>(null);
  const [selectedFlyerUrl, setSelectedFlyerUrl] = useState<string | null>(null);
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string | null>(null);
  const [selectedRollBannerUrl, setSelectedRollBannerUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false); // State for the nudge
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);
  
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const designData = {
    business_card: { designs: cardDesigns, setDesigns: setCardDesigns, selected: selectedCardUrl, setSelected: setSelectedCardUrl },
    flyer: { designs: flyerDesigns, setDesigns: setFlyerDesigns, selected: selectedFlyerUrl, setSelected: setSelectedFlyerUrl },
    banner: { designs: bannerDesigns, setDesigns: setBannerDesigns, selected: selectedBannerUrl, setSelected: setSelectedBannerUrl },
    roll_banner: { designs: rollBannerDesigns, setDesigns: setRollBannerDesigns, selected: selectedRollBannerUrl, setSelected: setSelectedRollBannerUrl },
  };
  
  const { designs, setDesigns, setSelected } = designData[activeTab];

  useEffect(() => {
      if (designs.length > 0 && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile && profile.storage_used_kb >= STORAGE_QUOTA_KB) {
        setError(`Waduh, gudang penyimpanan lo udah penuh (lebih dari 5MB). Hapus project lama buat ngosongin ruang ya.`);
        playSound('error');
        return;
    }
    
    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setShowNextStepNudge(false); // Reset nudge
    playSound('start');

    const { brandInputs, selectedPersona, logoPrompt } = projectData;
    if (!brandInputs || !selectedPersona || !logoPrompt) {
        setError("Waduh, data project-nya ada yang kurang buat generate media cetak.");
        setIsLoading(false);
        playSound('error');
        return;
    }
    
    setDesigns([]);
    setSelected(null);

    try {
        const payload = {
            brandInputs: {
                ...brandInputs,
                contactInfo: cardInfo,
                flyerContent: flyerInfo,
                bannerContent: bannerInfo,
                rollBannerContent: rollBannerInfo
            },
            selectedPersona,
            logoPrompt
        };
      const results = await generatePrintMedia(activeTab, payload);
      const uploadedUrl = await uploadImageFromBase64(results[0], userId, projectId, activeTab);

      await deductCredits(GENERATION_COST); // Deduct only on success
      setDesigns([uploadedUrl]);
      setSelected(uploadedUrl); // Auto-select the generated design
      setShowNextStepNudge(true); // Show nudge on success
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, projectData, cardInfo, flyerInfo, bannerInfo, rollBannerInfo, credits, deductCredits, setShowOutOfCreditsModal, setDesigns, setSelected, userId, projectId, profile]);

  const handleContinue = () => {
    onComplete({
        assets: {
            cardUrl: selectedCardUrl || undefined,
            flyerUrl: selectedFlyerUrl || undefined,
            bannerUrl: selectedBannerUrl || undefined,
            rollBannerUrl: selectedRollBannerUrl || undefined,
        },
        inputs: {
            contactInfo: cardInfo,
            flyerContent: flyerInfo,
            bannerContent: bannerInfo,
            rollBannerContent: rollBannerInfo,
        }
    });
  };
  
  const handleTabClick = (tab: MediaTab) => {
      playSound('select');
      setActiveTab(tab);
      setShowNextStepNudge(false); // Reset nudge when changing tabs
  }

  const renderContent = () => {
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
        case 'flyer':
            return (
                <div className="grid grid-cols-1 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Headline Utama" name="headline" value={flyerInfo.headline} onChange={(e) => handleInfoChange(e, setFlyerInfo)} placeholder="cth: Diskon Spesial!" />
                    <Textarea label="Isi / Deskripsi Penawaran" name="body" value={flyerInfo.body} onChange={(e) => handleInfoChange(e, setFlyerInfo)} rows={4} />
                    <Input label="Call to Action (CTA)" name="cta" value={flyerInfo.cta} onChange={(e) => handleInfoChange(e, setFlyerInfo)} placeholder="cth: Beli Sekarang!" />
                </div>
            );
        case 'banner':
            return (
                 <div className="grid grid-cols-1 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Headline (Teks Paling Besar)" name="headline" value={bannerInfo.headline} onChange={(e) => handleInfoChange(e, setBannerInfo)} placeholder="cth: GRAND OPENING!" />
                    <Input label="Sub-headline (Teks Pendukung)" name="subheadline" value={bannerInfo.subheadline} onChange={(e) => handleInfoChange(e, setBannerInfo)} placeholder="cth: Diskon 50% Semua Item" />
                </div>
            );
        case 'roll_banner':
             return (
                 <div className="grid grid-cols-1 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Input label="Headline (di bagian atas)" name="headline" value={rollBannerInfo.headline} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} />
                    <Textarea label="Isi Konten (bisa pakai bullet point)" name="body" value={rollBannerInfo.body} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} rows={4} />
                    <Input label="Info Kontak (di bagian bawah)" name="contact" value={rollBannerInfo.contact} onChange={(e) => handleInfoChange(e, setRollBannerInfo)} placeholder="cth: @namabisnislo" />
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 5: Studio Media Cetak Mang AI</h2>
        <p className="text-gray-400">Bikin materi promosi cetak yang keren. Pilih jenis media, isi detailnya, dan biarkan Mang AI mendesain untuk lo.</p>
      </div>
      
      <div className="flex flex-wrap border-b border-gray-700">
          <button onClick={() => handleTabClick('business_card')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'business_card' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Kartu Nama</button>
          <button onClick={() => handleTabClick('flyer')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'flyer' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Flyer</button>
          <button onClick={() => handleTabClick('banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'banner' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Spanduk</button>
          <button onClick={() => handleTabClick('roll_banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'roll_banner' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Roll Banner</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {renderContent()}
        <div className="self-start">
            <Button type="submit" isLoading={isLoading} disabled={credits < GENERATION_COST}>
                {`Sulap Jadi Desain! (${GENERATION_COST} Kredit)`}
            </Button>
        </div>
      </form>
      
      {error && <ErrorMessage message={error} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <h3 className="text-xl font-bold">Desain Hasil Generate:</h3>
          <div className="flex justify-center w-full max-w-lg">
              <div 
                className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
              >
                <img src={designs[0]} alt={`Generated design for ${activeTab}`} className="object-contain rounded-md max-w-full max-h-[400px] group-hover:scale-105 transition-transform" />
              </div>
          </div>
        </div>
      )}

      <div className="self-center mt-4 relative">
        {showNextStepNudge && (
            <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Cakep! Klik buat lanjut.
            </CalloutPopup>
        )}
        <Button onClick={handleContinue}>
          Lanjut ke Desain Kemasan &rarr;
        </Button>
      </div>
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Desain media cetak untuk ${projectData.brandInputs?.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PrintMediaGenerator;