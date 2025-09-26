import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialProfiles } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { SocialProfileData, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import CopyButton from './common/CopyButton';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { profiles: SocialProfileData }) => void;
}

const GENERATION_COST = 1;

const ProfileOptimizer: React.FC<Props> = ({ projectData, onComplete }) => {
  const { deductCredits, setShowOutOfCreditsModal, profile } = useAuth();
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

    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setProfileData(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const result = await generateSocialProfiles(brandInputs, selectedPersona);
      await deductCredits(GENERATION_COST);
      setProfileData(result);
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
    if (profileData) {
      onComplete({ profiles: profileData });
    }
  };
  
  const businessHandle = projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 6: Pengoptimal Profil Sosmed & Marketplace</h2>
        <p className="text-gray-400 max-w-3xl">
          Profil yang menjual itu kunci! Biar Mang AI yang bikinin bio Instagram, bio TikTok, dan deskripsi toko buat Shopee/Tokopedia yang ciamik dan sesuai persona brand lo.
        </p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST}>
        Buatin Profilnya, Mang AI! ({GENERATION_COST} Kredit)
      </Button>

      {error && <ErrorMessage message={error} />}

      {profileData && (
        <div ref={resultsRef} className="w-full max-w-5xl flex flex-col items-center gap-8 mt-4 scroll-mt-24">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Instagram Bio */}
            <Card title="Bio Instagram">
              <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                    <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-12 h-12 rounded-full bg-white p-0.5" />
                    <div>
                        <p className="font-bold text-white text-sm">{businessHandle}</p>
                    </div>
                </div>
                <div className="relative">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{profileData.instagramBio}</p>
                    <CopyButton textToCopy={profileData.instagramBio} className="absolute top-0 right-0" />
                </div>
              </div>
            </Card>

            {/* TikTok Bio */}
            <Card title="Bio TikTok">
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <img src={projectData.socialMediaKit?.profilePictureUrl} alt="logo" className="w-16 h-16 rounded-full bg-white p-1 mx-auto" />
                <p className="font-bold text-white mt-2">@{businessHandle}</p>
                <div className="relative mt-2">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{profileData.tiktokBio}</p>
                    <CopyButton textToCopy={profileData.tiktokBio} className="absolute top-0 right-0" />
                </div>
              </div>
            </Card>

            {/* Marketplace Description */}
            <Card title="Deskripsi Toko Marketplace">
                <div className="relative">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-auto">{profileData.marketplaceDescription}</p>
                    <CopyButton textToCopy={profileData.marketplaceDescription} className="absolute top-0 right-0" />
                </div>
            </Card>
          </div>
          
          <div className="self-center mt-4 relative">
            {showNextStepNudge && (
                <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                    Profil siap! Lanjut, Juragan?
                </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!profileData}>
              Lanjut ke Iklan Sosmed &rarr;
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ProfileOptimizer;
