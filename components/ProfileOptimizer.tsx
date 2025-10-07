import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialProfiles } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import { useUserActions } from '../contexts/UserActionsContext';
import type { SocialProfileData, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import CopyButton from './common/CopyButton';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { profiles: SocialProfileData }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 1;

const ProfileOptimizer: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  // FIX: Destructure profile from useAuth and other actions from useUserActions
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const { petState } = useAIPet();
  const credits = profile?.credits ?? 0;

  const [profileData, setProfileData] = useState<SocialProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileData && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [profileData]);

  const handleSubmit = useCallback(async () => {
    const { brandInputs, selectedPersona } = projectData;
    if (!brandInputs || !selectedPersona) return;

    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }

    setIsLoading(true);
    setError(null);
    setProfileData(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const result = await generateSocialProfiles(brandInputs, selectedPersona, petState);
      if (!(await deductCredits(GENERATION_COST))) return;
      setProfileData(result);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal, petState]);
  
  const handleContinue = () => {
    if (profileData) {
      onComplete({ profiles: profileData });
    }
  };
  
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 5: Optimasi Profil Sosmed & Marketplace</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Profil yang menjual itu kunci! Biar Mang AI yang bikinin bio Instagram, bio TikTok, dan deskripsi toko buat Shopee/Tokopedia yang ciamik dan sesuai persona brand lo.</p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST} size="large">Buatin Profilnya, Mang AI! ({GENERATION_COST} Token)</Button>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {profileData && (
        <div ref={resultsRef} className="w-full max-w-5xl flex flex-col items-center gap-8 mt-4 scroll-mt-24">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Bio Instagram" className="animate-item-appear">
              <div className="bg-background p-4 rounded-lg space-y-2 border border-border-main">
                <div className="flex items-center gap-3">
                    <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-12 h-12 rounded-full bg-white p-0.5 border" />
                    <div><p className="font-bold text-text-header text-sm">{businessHandle}</p></div>
                </div>
                <div className="relative pt-2">
                    <p className="text-sm text-text-body whitespace-pre-wrap selectable-text">{profileData.instagramBio}</p>
                    <CopyButton textToCopy={profileData.instagramBio} className="absolute top-2 right-2" />
                </div>
              </div>
            </Card>

            <Card title="Bio TikTok" className="animate-item-appear" style={{animationDelay: '100ms'}}>
              <div className="bg-background p-4 rounded-lg text-center border border-border-main">
                <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-16 h-16 rounded-full bg-white p-1 mx-auto border" />
                <p className="font-bold text-text-header mt-2">@{businessHandle}</p>
                <div className="relative mt-2">
                    <p className="text-sm text-text-body whitespace-pre-wrap selectable-text">{profileData.tiktokBio}</p>
                    <CopyButton textToCopy={profileData.tiktokBio} className="absolute top-0 right-0" />
                </div>
              </div>
            </Card>

            <Card title="Deskripsi Toko Marketplace" className="animate-item-appear" style={{animationDelay: '200ms'}}>
                <div className="relative bg-background p-4 rounded-lg border border-border-main">
                    <p className="text-sm text-text-body whitespace-pre-wrap max-h-48 overflow-auto selectable-text">{profileData.marketplaceDescription}</p>
                    <CopyButton textToCopy={profileData.marketplaceDescription} className="absolute top-2 right-2" />
                </div>
            </Card>
          </div>
          
          <div className="self-center mt-4 relative">
            {showNextStepNudge && (<CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Profil siap! Lanjut, Juragan?</CalloutPopup>)}
            <Button onClick={handleContinue} disabled={!profileData} size="large">Lanjut ke Desain Kemasan &rarr;</Button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ProfileOptimizer;
