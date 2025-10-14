// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialAds } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
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
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const credits = profile?.credits ?? 0;

  const [adsData, setAdsData] = useState<SocialAdsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adsData && resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [adsData]);

  const handleSubmit = useCallback(async () => {
    const { brandInputs, selectedPersona, selectedSlogan } = projectData;
    if (!brandInputs || !selectedPersona || !selectedSlogan) return;
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }

    setIsLoading(true);
    setError(null);
    setAdsData(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      // FIX: Pass null for the petState argument to match the function signature.
      const result = await generateSocialAds(brandInputs, selectedPersona, selectedSlogan, null);
      if (!(await deductCredits(GENERATION_COST))) return;
      setAdsData(result);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal]);
  
  const handleContinue = () => { if (adsData) onComplete({ adsData }); };
  
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 9: Teks Iklan Sosmed</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Saatnya beriklan! Di langkah ini, Mang AI akan meracik beberapa pilihan teks iklan (ad copy) untuk Instagram dan TikTok, lengkap dengan hashtag yang relevan untuk menjangkau audiens.</p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST} size="large">Buatin Teks Iklannya Dong! ({GENERATION_COST} Token)</Button>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {adsData && (
        <div ref={resultsRef} className="w-full max-w-6xl flex flex-col items-center gap-8 mt-4 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {adsData.map((ad, index) => (
                <Card key={index} title={`Opsi Iklan untuk ${ad.platform}`} className="animate-item-appear" style={{animationDelay: `${index*100}ms`}}>
                    <div className="space-y-4">
                        <div className="bg-background p-4 rounded-lg border border-border-main">
                             <div className="flex items-center gap-3 mb-3">
                                <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-10 h-10 rounded-full bg-white p-0.5 border" />
                                <div>
                                    <p className="font-bold text-text-header text-sm">{businessHandle}</p>
                                    <p className="text-xs text-text-muted">Sponsored</p>
                                </div>
                            </div>
                            <div className="relative">
                                <p className="text-sm text-text-body whitespace-pre-wrap selectable-text">{ad.adCopy}</p>
                                <CopyButton textToCopy={ad.adCopy} className="absolute top-0 right-0" />
                            </div>
                        </div>
                         <div className="relative pt-2">
                            <p className="text-primary text-xs break-words selectable-text">{ad.hashtags.join(' ')}</p>
                            <CopyButton textToCopy={ad.hashtags.join(' ')} className="absolute top-0 right-0" />
                        </div>
                    </div>
                </Card>
            ))}
          </div>
          <div className="self-center mt-4 relative">
            {showNextStepNudge && (<CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Teks iklan siap! Lanjut?</CalloutPopup>)}
            <Button onClick={handleContinue} disabled={!adsData} size="large">Lanjut ke Mockup Merchandise &rarr;</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAdsGenerator;