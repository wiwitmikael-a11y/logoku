
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialMediaKitAssets } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, SocialMediaKitAssets } from '../types';
import Button from './common/Button';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { assets: SocialMediaKitAssets }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 2; // Cost for generating two assets at once

const SocialMediaKitGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [assets, setAssets] = useState<SocialMediaKitAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
      if (assets && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [assets]);

  const handleSubmit = useCallback(async () => {
    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setAssets(null);
    setShowNextStepNudge(false);
    playSound('start');

    const { brandInputs, selectedPersona, selectedLogoUrl, selectedSlogan } = projectData;
    if (!brandInputs || !selectedPersona || !selectedLogoUrl || !selectedSlogan) {
        setError("Waduh, data project (logo/persona/slogan) ada yang kurang buat generate social media kit.");
        setIsLoading(false);
        playSound('error');
        return;
    }

    try {
        const resultAssets = await generateSocialMediaKitAssets(projectData as ProjectData);
      
        await deductCredits(GENERATION_COST);
        setAssets(resultAssets);
        setShowNextStepNudge(true);
        playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleContinue = () => {
    if (assets) {
        onComplete({ assets });
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 5: Social Media Kit Muka Depan</h2>
        <p className="text-gray-400 max-w-3xl">
          Tampilan profil itu penting! Biar Mang AI bikinin foto profil dan banner/header yang serasi buat halaman Facebook, X, atau YouTube lo, lengkap dengan logo, warna brand, dan slogan.
        </p>
      </div>
      
      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST}>
        Buatin Kit Sosmednya! ({GENERATION_COST} Token)
      </Button>
      
      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {assets && (
        <div ref={resultsRef} className="flex flex-col gap-8 items-center scroll-mt-24 w-full max-w-4xl">
            <h3 className="text-xl font-bold">Aset Visual Sosmed Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
              {/* Profile Picture */}
              <div className="md:col-span-2 flex flex-col items-center gap-3">
                  <h4 className="font-semibold text-lg">Foto Profil</h4>
                  <div 
                    className="bg-white rounded-full p-2 flex items-center justify-center shadow-lg w-48 h-48 cursor-pointer group"
                    onClick={() => openModal(assets.profilePictureUrl)}
                  >
                    <img src={assets.profilePictureUrl} alt="Generated Profile Picture" className="object-contain rounded-full max-w-full max-h-full group-hover:scale-105 transition-transform" />
                  </div>
                   <p className="text-xs text-center text-gray-400">Cocok untuk Instagram, TikTok, Facebook, WhatsApp, dll.</p>
              </div>

              {/* Banner */}
              <div className="md:col-span-3 flex flex-col items-center gap-3">
                  <h4 className="font-semibold text-lg">Banner / Header</h4>
                    <div 
                        className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full aspect-video cursor-pointer group"
                        onClick={() => openModal(assets.bannerUrl)}
                    >
                        <img src={assets.bannerUrl} alt="Generated Banner" className="w-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                     <p className="text-xs text-center text-gray-400">Cocok untuk header Facebook, X, YouTube, dll.</p>
              </div>
          </div>

          <div className="self-center mt-4 relative">
            {showNextStepNudge && (
                <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                    Cakep! Klik buat lanjut.
                </CalloutPopup>
            )}
            <Button onClick={handleContinue}>
              Lanjut ke Optimasi Profil &rarr;
            </Button>
          </div>
        </div>
      )}
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Aset media sosial untuk ${projectData.brandInputs?.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default SocialMediaKitGenerator;