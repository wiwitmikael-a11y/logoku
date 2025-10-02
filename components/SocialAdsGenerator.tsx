

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialAds } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { SocialAdsData, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import CopyButton from './common/CopyButton';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { adsData: SocialAdsData }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 1;

const SocialAdsGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { deductCredits, setShowOutOfCreditsModal, profile } = useAuth();
  const credits = profile?.credits ?? 0;

  const [adsData, setAdsData] = useState<SocialAdsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adsData && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [adsData]);

  const handleSubmit = useCallback(async () => {
    const { brandInputs, selectedPersona, selectedSlogan } = projectData;
    if (!brandInputs || !selectedPersona || !selectedSlogan) return;

    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setAdsData(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const result = await generateSocialAds(brandInputs, selectedPersona, selectedSlogan);
      await deductCredits(GENERATION_COST);
      setAdsData(result);
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
    if (adsData) {
      onComplete({ adsData });
    }
  };
  
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 9: Teks Iklan Sosmed</h2>
        <p className="text-gray-400 max-w-3xl">
          Saatnya ngiklan di tempat yang pas! Biar Mang AI racik beberapa pilihan teks iklan untuk Instagram dan TikTok yang ciamik, lengkap dengan hashtag yang relevan.
        </p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST}>
        Buatin Teks Iklannya Dong! ({GENERATION_COST} Token)
      </Button>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {adsData && (
        <div ref={resultsRef} className="w-full max-w-6xl flex flex-col items-center gap-8 mt-4 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {adsData.map((ad, index) => (
                <Card key={index} title={`Opsi Iklan untuk ${ad.platform}`}>
                    <div className="space-y-4">
                        {/* Ad Preview */}
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                             <div className="flex items-center gap-3 mb-3">
                                <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-10 h-10 rounded-full bg-white p-0.5" />
                                <div>
                                    <p className="font-bold text-white text-sm">{businessHandle}</p>
                                    <p className="text-xs text-gray-400">Sponsored</p>
                                </div>
                            </div>
                            <div className="relative">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap selectable-text">{ad.adCopy}</p>
                                <CopyButton textToCopy={ad.adCopy} className="absolute top-0 right-0" />
                            </div>
                        </div>
                        
                        {/* Keywords */}
                         <div className="relative">
                            <p className="text-indigo-300 text-xs break-words selectable-text">{ad.hashtags.join(' ')}</p>
                            <CopyButton textToCopy={ad.hashtags.join(' ')} className="absolute top-0 right-0" />
                        </div>
                    </div>
                </Card>
            ))}
          </div>

          <div className="self-center mt-4 relative">
            {showNextStepNudge && (
                <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                    Langkah terakhir! Ayo selesaikan.
                </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!adsData}>
              Selesai & Lihat Brand Kit Lengkap &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAdsGenerator;