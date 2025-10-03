import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialMediaKitAssets } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, SocialMediaKitAssets } from '../types';
import Button from './common/Button';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import Card from './common/Card';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { assets: SocialMediaKitAssets }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 2;

const SocialMediaKitGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [assets, setAssets] = useState<SocialMediaKitAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (assets && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [assets]);

  const handleSubmit = useCallback(async () => {
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    setIsLoading(true);
    setError(null);
    setAssets(null);
    setShowNextStepNudge(false);
    playSound('start');

    if (!projectData.brandInputs || !projectData.selectedPersona || !projectData.selectedLogoUrl || !projectData.selectedSlogan) {
        setError("Waduh, data project (logo/persona/slogan) ada yang kurang.");
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
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
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
        <h2 className="text-4xl md:text-5xl font-bold text-splash mb-2">Langkah 4: Social Media Kit</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Tampilan profil itu penting! Di sini, Mang AI akan membuatkan foto profil dan banner header yang serasi untuk muka depan sosial media lo (Facebook, X, YouTube, dll.).</p>
      </div>
      
      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST} size="large">Buatin Kit Sosmednya! ({GENERATION_COST} Token)</Button>
      
      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {assets && (
        <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-4 flex items-start gap-4 text-left w-full max-w-4xl">
            <div className="flex-shrink-0 pt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
            <div>
                <h4 className="font-bold text-orange-300">Peringatan Penyimpanan Lokal!</h4>
                <p className="text-sm text-orange-300/80 mt-1">Aset visual ini hanya disimpan sementara di browser. Segera lanjutkan ke langkah berikutnya untuk menyimpan progres. <strong>Progres akan hilang jika lo me-refresh atau menutup halaman ini.</strong></p>
            </div>
        </div>
      )}

      {assets && (
        <div ref={resultsRef} className="flex flex-col gap-8 items-center scroll-mt-24 w-full max-w-5xl">
            <h3 className="text-3xl font-bold text-text-header">Aset Visual Sosmed Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 w-full items-center">
              <div className="md:col-span-2 flex flex-col items-center gap-3 animate-item-appear">
                  <Card title="Foto Profil" className="w-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-background rounded-full p-2 flex items-center justify-center w-48 h-48 cursor-pointer group" onClick={() => setModalImageUrl(assets.profilePictureUrl)}>
                            <img src={assets.profilePictureUrl} alt="Generated Profile Picture" className="object-contain rounded-full max-w-full max-h-full group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="text-xs text-center text-text-muted">Cocok untuk Instagram, TikTok, Facebook, WhatsApp, dll.</p>
                    </div>
                  </Card>
              </div>

              <div className="md:col-span-3 flex flex-col items-center gap-3 animate-item-appear" style={{animationDelay: '150ms'}}>
                  <Card title="Banner / Header" className="w-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-background rounded-lg p-2 flex items-center justify-center w-full aspect-video cursor-pointer group" onClick={() => setModalImageUrl(assets.bannerUrl)}>
                            <img src={assets.bannerUrl} alt="Generated Banner" className="w-full object-contain group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="text-xs text-center text-text-muted">Cocok untuk header Facebook, X, YouTube, dll.</p>
                    </div>
                  </Card>
              </div>
          </div>

          <div className="self-center mt-4 relative">
            {showNextStepNudge && (<CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">Cakep! Klik buat lanjut.</CalloutPopup>)}
            <Button onClick={handleContinue} size="large">Lanjut ke Optimasi Profil &rarr;</Button>
          </div>
        </div>
      )}
      
      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText={`Aset media sosial untuk ${projectData.brandInputs?.businessName}`} onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default SocialMediaKitGenerator;