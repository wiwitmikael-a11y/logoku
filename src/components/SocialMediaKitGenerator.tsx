// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateSocialMediaKitAssets, generateSocialProfiles } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';

const VISUAL_KIT_COST = 3;
const PROFILE_TEXT_COST = 1;
const XP_REWARD = 100;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
  onComplete: () => void;
}

const SocialMediaKitGenerator: React.FC<Props> = ({ project, onUpdateProject, onComplete }) => {
  const { deductCredits, addXp } = useUserActions();
  const [isLoading, setIsLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  const { selectedPersona, selectedLogoUrl, brandInputs, socialMediaKit, socialProfiles } = project.project_data;

  const handleGenerateVisuals = async () => {
    setIsLoading('visuals'); setError(null);
    try {
      if (!(await deductCredits(VISUAL_KIT_COST))) return;
      const assets = await generateSocialMediaKitAssets(project.project_data);
      await onUpdateProject({ socialMediaKit: assets });
      await addXp(XP_REWARD / 2);
      playSound('success');
    } catch (err) { setError((err as Error).message); }
    finally { setIsLoading(false); }
  };
  
  const handleGenerateProfiles = async () => {
    if (!brandInputs || !selectedPersona) return;
    setIsLoading('profiles'); setError(null);
    try {
      if (!(await deductCredits(PROFILE_TEXT_COST))) return;
      const profiles = await generateSocialProfiles(brandInputs, selectedPersona);
      await onUpdateProject({ socialProfiles: profiles });
       await addXp(XP_REWARD / 2);
    } catch (err) { setError((err as Error).message); }
    finally { setIsLoading(false); }
  };

  const isComplete = !!socialMediaKit && !!socialProfiles;

  if (!selectedPersona || !selectedLogoUrl) {
    return (
      <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
        <span className="text-5xl mb-4">📱</span>
        <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona & Logo Dulu!</h2>
        <p className="mt-2 text-text-muted max-w-md">Kit media sosial butuh logo dan kepribadian yang jelas. Silakan lengkapi langkah 1 & 2 dulu, Juragan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full"><span className="text-3xl">📱</span></div>
        <div>
          <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 3: Amunisi Media Sosial</h3>
          <p className="text-sm text-text-body mt-1">Brand-mu siap go-digital! Mang AI akan siapkan foto profil, banner, dan draf bio untuk Instagram, TikTok, dan deskripsi marketplace. Langsung siap pakai!</p>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Kit */}
        <div className="p-4 bg-background rounded-lg space-y-3">
          <h4 className="font-semibold text-text-header">3a. Kit Visual (Foto Profil & Banner)</h4>
          {socialMediaKit ? (
            <div className="flex gap-4">
              <div className="text-center">
                <img src={socialMediaKit.profilePictureUrl} onClick={() => setModalImageUrl(socialMediaKit.profilePictureUrl)} alt="Profile" className="w-24 h-24 rounded-full cursor-pointer" />
                <p className="text-xs mt-1">Foto Profil</p>
              </div>
              <div className="text-center flex-grow">
                 <img src={socialMediaKit.bannerUrl} onClick={() => setModalImageUrl(socialMediaKit.bannerUrl)} alt="Banner" className="w-full h-24 object-cover rounded-lg cursor-pointer" />
                 <p className="text-xs mt-1">Banner</p>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerateVisuals} isLoading={isLoading === 'visuals'}>Buat Aset Visual ({VISUAL_KIT_COST} Token)</Button>
          )}
        </div>
        
        {/* Profile Texts */}
        <div className="p-4 bg-background rounded-lg space-y-3">
          <h4 className="font-semibold text-text-header">3b. Teks Profil (Bio & Deskripsi)</h4>
          {socialProfiles ? (
            <div className="space-y-2 text-sm">
                <div className="bg-surface p-2 rounded">
                    <p className="font-semibold text-text-muted">Instagram Bio:</p>
                    <p className="italic text-text-body flex justify-between items-start">"{socialProfiles.instagramBio}" <CopyButton textToCopy={socialProfiles.instagramBio}/></p>
                </div>
                 <div className="bg-surface p-2 rounded">
                    <p className="font-semibold text-text-muted">TikTok Bio:</p>
                    <p className="italic text-text-body flex justify-between items-start">"{socialProfiles.tiktokBio}" <CopyButton textToCopy={socialProfiles.tiktokBio}/></p>
                </div>
                 <div className="bg-surface p-2 rounded">
                    <p className="font-semibold text-text-muted">Deskripsi Marketplace:</p>
                    <p className="italic text-text-body flex justify-between items-start">"{socialProfiles.marketplaceDescription}" <CopyButton textToCopy={socialProfiles.marketplaceDescription}/></p>
                </div>
            </div>
          ) : (
            <Button onClick={handleGenerateProfiles} isLoading={isLoading === 'profiles'}>Buat Teks Profil ({PROFILE_TEXT_COST} Token)</Button>
          )}
        </div>
      </div>
      
      {isComplete && (
         <div className="mt-6 pt-6 border-t border-border-main text-center animate-content-fade-in">
            <Button onClick={onComplete} variant="accent">
                Lanjut ke Rencana Konten →
            </Button>
        </div>
      )}

       {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Aset Visual" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default SocialMediaKitGenerator;