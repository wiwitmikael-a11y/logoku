import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateGoogleAdsContent } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { AdsData, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { adsData: AdsData }) => void;
}

const GENERATION_COST = 1;

const GoogleAdsGenerator: React.FC<Props> = ({ projectData, onComplete }) => {
  const { deductCredits, setShowOutOfCreditsModal, profile } = useAuth();
  const credits = profile?.credits ?? 0;

  const [adsData, setAdsData] = useState<AdsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adsData && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [adsData]);

  const handleSubmit = useCallback(async () => {
    if (!projectData.brandInputs || !projectData.selectedSlogan) return;

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
      const result = await generateGoogleAdsContent(projectData.brandInputs, projectData.selectedSlogan);
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
  
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    playSound('click');
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleContinue = () => {
    if (adsData) {
      onComplete({ adsData });
    }
  };
  
  const businessUrl = `www.${projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '')}.com`;

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 7: Optimasi Iklan Google</h2>
        <p className="text-gray-400 max-w-3xl">
          Saatnya ngiklan! Biar Mang AI racik beberapa pilihan teks iklan Google yang ciamik, lengkap dengan headline, deskripsi, dan kata kunci yang relevan.
        </p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST}>
        Buatin Teks Iklannya Dong! ({GENERATION_COST} Kredit)
      </Button>

      {error && <ErrorMessage message={error} />}

      {adsData && (
        <div ref={resultsRef} className="w-full max-w-6xl flex flex-col items-center gap-8 mt-4 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {adsData.map((ad, index) => (
                <Card key={index} title={`Opsi Iklan ${index + 1}`}>
                    <div className="space-y-4">
                        {/* Ad Preview */}
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold border border-gray-500 text-gray-300 px-1.5 py-0.5 rounded-sm">Ad</span>
                                <p className="text-xs text-gray-400">{businessUrl}</p>
                            </div>
                            <h3 className="text-lg text-blue-400 hover:underline cursor-pointer">
                                {ad.headlines.join(' | ')}
                            </h3>
                            <p className="text-sm text-gray-300 mt-1">
                                {ad.descriptions.join(' ')}
                            </p>
                        </div>
                        
                        {/* Keywords */}
                        <div>
                            <h4 className="font-semibold text-gray-200 text-sm mb-2">Rekomendasi Keywords:</h4>
                             <div className="flex flex-wrap gap-2">
                                {ad.keywords.map((keyword, kwIndex) => (
                                    <span key={kwIndex} className="bg-gray-700 text-gray-200 text-xs font-medium px-2 py-1 rounded-full">{keyword}</span>
                                ))}
                            </div>
                        </div>

                        {/* Copy Buttons */}
                        <div className="pt-3 border-t border-gray-700 flex flex-col gap-2">
                             <Button onClick={() => handleCopyToClipboard(ad.headlines.join('\n'), `headlines-${index}`)} size="small" variant="secondary">
                                {copyStatus === `headlines-${index}` ? 'Headlines Tersalin!' : 'Salin Headlines'}
                            </Button>
                            <Button onClick={() => handleCopyToClipboard(ad.descriptions.join('\n\n'), `desc-${index}`)} size="small" variant="secondary">
                                {copyStatus === `desc-${index}` ? 'Deskripsi Tersalin!' : 'Salin Deskripsi'}
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
          </div>

          <div className="self-center mt-4 relative">
            {showNextStepNudge && (
                <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                    Teks iklan siap! Lanjut?
                </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!adsData}>
              Lanjut ke Desain Kemasan &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsGenerator;