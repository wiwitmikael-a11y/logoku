import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSeoContent } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { SeoData, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { seoData: SeoData }) => void;
}

const GENERATION_COST = 1;

const SeoGenerator: React.FC<Props> = ({ projectData, onComplete }) => {
  const { deductCredits, setShowOutOfCreditsModal, profile } = useAuth();
  const credits = profile?.credits ?? 0;

  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seoData && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [seoData]);

  const handleSubmit = useCallback(async () => {
    if (!projectData.brandInputs) return;

    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setSeoData(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const result = await generateSeoContent(projectData.brandInputs);
      await deductCredits(GENERATION_COST);
      setSeoData(result);
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
    setTimeout(() => setCopyStatus(null), 2000); // Reset status after 2 seconds
  };

  const handleContinue = () => {
    if (seoData) {
      onComplete({ seoData });
    }
  };
  
  const businessUrl = `www.${projectData.brandInputs?.businessName.toLowerCase().replace(/\s/g, '')}.com`;

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 6: Optimasi Google (SEO)</h2>
        <p className="text-gray-400 max-w-3xl">
          Biar bisnis lo gampang ditemuin di Google, Mang AI bakal bikinin resep SEO-nya. Mulai dari kata kunci, judul & deskripsi pencarian, sampe buat profil Google Business lo.
        </p>
      </div>

      <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST}>
        Optimasi Bisnisku, Mang AI! ({GENERATION_COST} Kredit)
      </Button>

      {error && <ErrorMessage message={error} />}

      {seoData && (
        <div ref={resultsRef} className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 scroll-mt-24">
          
          {/* Left Column: Keywords & GMB */}
          <div className="flex flex-col gap-8">
            <Card title="Rekomendasi Kata Kunci (Keywords)">
                <p className="text-sm text-gray-400 mb-4">Gunakan kata-kata ini di website atau postingan sosmed lo biar gampang dicari orang.</p>
                <div className="flex flex-wrap gap-2">
                    {seoData.keywords.map((keyword, index) => (
                        <span key={index} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">{keyword}</span>
                    ))}
                </div>
            </Card>

            <Card title="Deskripsi Profil Google Business">
                <div className="relative">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{seoData.gmbDescription}</p>
                    <button 
                        onClick={() => handleCopyToClipboard(seoData.gmbDescription, 'gmb')} 
                        title="Salin deskripsi" 
                        className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-indigo-400 transition-colors bg-gray-800 rounded-full"
                    >
                      {copyStatus === 'gmb' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                      )}
                    </button>
                </div>
            </Card>
          </div>

          {/* Right Column: Meta Preview */}
          <Card title="Preview Hasil Pencarian Google">
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                    <img src={projectData.selectedLogoUrl} alt="logo" className="w-6 h-6 rounded-full bg-white p-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-white">{projectData.brandInputs?.businessName}</p>
                        <p className="text-xs text-gray-400">{businessUrl}</p>
                    </div>
                </div>
                <h3 className="text-lg text-blue-400 hover:underline cursor-pointer">{seoData.metaTitle}</h3>
                <p className="text-sm text-gray-300 mt-1">{seoData.metaDescription}</p>
            </div>
             <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => handleCopyToClipboard(seoData.metaTitle, 'title')} size="small" variant="secondary">
                    {copyStatus === 'title' ? 'Judul Tersalin!' : 'Salin Judul'}
                </Button>
                <Button onClick={() => handleCopyToClipboard(seoData.metaDescription, 'desc')} size="small" variant="secondary">
                    {copyStatus === 'desc' ? 'Deskripsi Tersalin!' : 'Salin Deskripsi'}
                </Button>
            </div>
          </Card>
        </div>
      )}
      
      <div className="self-center mt-6 relative">
        {showNextStepNudge && (
            <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                SEO siap! Lanjut, Juragan?
            </CalloutPopup>
        )}
        <Button onClick={handleContinue} disabled={!seoData}>
          Lanjut ke Iklan Google &rarr;
        </Button>
      </div>

    </div>
  );
};

export default SeoGenerator;
