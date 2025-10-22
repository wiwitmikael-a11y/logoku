// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateSocialMediaKitAssets, generateSocialProfiles } from '../services/geminiService';
import type { Project, ProjectData, SocialMediaKit, SocialProfiles } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import CopyButton from './common/CopyButton';

const KIT_COST = 4;
const PROFILE_COST = 2;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

const SocialMediaKitGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp } = useUserActions();
  const { selectedLogoUrl, selectedPersona, brandInputs } = project.project_data;

  const [kit, setKit] = useState<SocialMediaKit | null>(project.project_data.socialMediaKit);
  const [profiles, setProfiles] = useState<SocialProfiles | null>(project.project_data.socialProfiles);
  const [isLoading, setIsLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
      setKit(project.project_data.socialMediaKit);
      setProfiles(project.project_data.socialProfiles);
  }, [project]);

  if (!selectedLogoUrl || !selectedPersona || !brandInputs) {
    return <div className="p-6 bg-surface rounded-2xl text-center"><p>Selesaikan Langkah 1 & 2 dulu untuk membuka fitur ini.</p></div>;
  }

  const handleGenerateKit = async () => {
    if ((await deductCredits(KIT_COST)) === false) return;
    setIsLoading('kit'); setError(null);
    try {
      const newKit = await generateSocialMediaKitAssets(project.project_data);
      setKit(newKit);
      await onUpdateProject({ socialMediaKit: newKit });
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  };

  const handleGenerateProfiles = async () => {
    if ((await deductCredits(PROFILE_COST)) === false) return;
    setIsLoading('profiles'); setError(null);
    try {
      const newProfiles = await generateSocialProfiles(brandInputs, selectedPersona);
      setProfiles(newProfiles);
      await onUpdateProject({ socialProfiles: newProfiles });
      await addXp(XP_REWARD);
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  };
  
  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kit Generator */}
        <div className="lg:col-span-2 p-4 bg-surface rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-text-header">Aset Foto Profil & Banner</h3>
          <p className="text-sm text-text-muted">Mang AI akan membuatkan foto profil dan banner yang pas dengan gaya brand-mu, menggunakan logo yang sudah kamu pilih.</p>
          <Button onClick={handleGenerateKit} isLoading={isLoading === 'kit'} disabled={!!isLoading}>
            Buat Aset Kit Medsos ({KIT_COST} Token)
          </Button>
          {isLoading === 'kit' && <div className="flex justify-center p-4"><LoadingMessage /></div>}
          {kit && (
             <div className="animate-content-fade-in space-y-4">
                <div>
                    <h4 className="font-semibold text-text-muted mb-2">Foto Profil</h4>
                    <img src={kit.profilePictureUrl} alt="Profile Picture" className="w-32 h-32 rounded-full object-cover bg-white"/>
                </div>
                <div>
                    <h4 className="font-semibold text-text-muted mb-2">Banner</h4>
                    <img src={kit.bannerUrl} alt="Banner" className="w-full aspect-[3/1] rounded-lg object-cover bg-white"/>
                </div>
             </div>
          )}
        </div>
        
        {/* Profile Text Generator */}
        <div className="lg:col-span-1 p-4 bg-surface rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-text-header">Bio & Deskripsi Toko</h3>
          <p className="text-sm text-text-muted">Biar nggak pusing, biar Mang AI yang bikinin bio Instagram, TikTok, dan deskripsi untuk marketplace.</p>
          <Button onClick={handleGenerateProfiles} isLoading={isLoading === 'profiles'} disabled={!!isLoading}>
            Buat Teks Profil ({PROFILE_COST} T, +{XP_REWARD} XP)
          </Button>
          {isLoading === 'profiles' && <div className="flex justify-center p-4"><LoadingMessage /></div>}
          {profiles && (
             <div className="animate-content-fade-in space-y-4 text-sm">
                <div className="p-3 bg-background rounded-md">
                    <div className="flex justify-between items-center">
                        <h5 className="font-bold">Instagram Bio</h5>
                        <CopyButton textToCopy={profiles.instagramBio}/>
                    </div>
                    <p className="mt-1 text-text-body whitespace-pre-wrap">{profiles.instagramBio}</p>
                </div>
                 <div className="p-3 bg-background rounded-md">
                    <div className="flex justify-between items-center">
                        <h5 className="font-bold">TikTok Bio</h5>
                        <CopyButton textToCopy={profiles.tiktokBio}/>
                    </div>
                    <p className="mt-1 text-text-body whitespace-pre-wrap">{profiles.tiktokBio}</p>
                </div>
                 <div className="p-3 bg-background rounded-md">
                    <div className="flex justify-between items-center">
                        <h5 className="font-bold">Deskripsi Marketplace</h5>
                        <CopyButton textToCopy={profiles.marketplaceDescription}/>
                    </div>
                    <p className="mt-1 text-text-body whitespace-pre-wrap">{profiles.marketplaceDescription}</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialMediaKitGenerator;
