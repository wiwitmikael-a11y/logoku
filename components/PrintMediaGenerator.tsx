// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePrintMedia } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, PrintMediaAssets } from '../types';
import Button from './common/Button';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import Card from './common/Card';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { assets: PrintMediaAssets }) => void;
  onGoToDashboard: () => void;
}

type MediaTab = 'roll_banner' | 'banner';
const GENERATION_COST = 1;

const PrintMediaGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [activeTab, setActiveTab] = useState<MediaTab>('banner');
  const [designs, setDesigns] = useState<string[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<PrintMediaAssets>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (designs.length > 0 && resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setShowNextStepNudge(false);
    playSound('start');

    const { brandInputs, selectedPersona, selectedLogoUrl, logoVariations } = projectData;
    if (!brandInputs || !selectedPersona || !selectedLogoUrl) {
        setError("Data project (logo/persona) tidak lengkap.");
        setIsLoading(false);
        playSound('error');
        return;
    }

    try {
      let prompt = '';
      const colors = selectedPersona.palet_warna_hex.join(', ');
      const style = selectedPersona.kata_kunci.join(', ');
      let logoToUseUrl = selectedLogoUrl;
      let promptContainsText = false;

      if (activeTab === 'banner' && logoVariations?.horizontal) {
          logoToUseUrl = logoVariations.horizontal;
          promptContainsText = true;
      } else if (activeTab === 'roll_banner' && logoVariations?.stacked) {
          logoToUseUrl = logoVariations.stacked;
          promptContainsText = true;
      }
      
      const textInstruction = promptContainsText ? "The provided logo already has text, so DO NOT generate any additional text." : "DO NOT generate any text, letters, or words.";

      if (activeTab === 'banner') {
          prompt = `Take the provided logo image. Create a visually stunning and highly functional flat graphic design TEMPLATE for a wide horizontal outdoor banner (spanduk, 3:1 aspect ratio). Do NOT create a realistic 3D mockup. The design must be a 2D, print-ready file.
- **Visual Hierarchy:** Place the logo prominently in a corner (e.g., top-left) to establish brand identity first.
- **Color Palette:** Use the brand's color palette (${colors}) to create a dynamic and abstract background with geometric shapes or subtle gradients that are not distracting.
- **Functional Layout:** The core principle is functionality. A large, clean primary area (either centered or following the rule of thirds) MUST be left with a very light, solid color from the palette. This is a placeholder for the user to add a large headline and other text.
- **Style:** The overall aesthetic should be professional, modern, and incorporate the brand's style: ${style}.
- **Critical Instruction:** ${textInstruction}`;
      } else if (activeTab === 'roll_banner') {
          prompt = `Take the provided logo image. Create a visually stunning and highly functional flat graphic design TEMPLATE for a vertical roll-up banner with a **1:3 aspect ratio (tall and narrow)**. Do NOT create a mockup, create the final print-ready file.
- **Visual Hierarchy:** Place the logo at the top-center, leaving adequate 'headroom' above it as the primary focal point.
- **Color Palette:** Use the brand's color palette (${colors}) to create elegant, abstract shapes or vertical bands of color along the sides, framing the main content area.
- **Functional Layout:** The central vertical column of the banner must be a clean, solid, light color from the palette. This large empty space is the primary placeholder for the user to add a headline, bullet points, and contact information. The layout should guide the viewer's eye from top to bottom.
- **Style:** The overall aesthetic should be professional, stylish, and incorporate the brand's style: ${style}.
- **Critical Instruction:** ${textInstruction}`;
      }
      
      const logoBase64 = await fetchImageAsBase64(logoToUseUrl);
      const results = await generatePrintMedia(prompt, logoBase64);
      
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      
      if (activeTab === 'roll_banner') setGeneratedAssets(prev => ({ ...prev, rollBannerUrl: results[0] }));
      else if (activeTab === 'banner') setGeneratedAssets(prev => ({ ...prev, bannerUrl: results[0] }));

      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal, activeTab]);

  const handleContinue = () => { onComplete({ assets: generatedAssets }); };
  const handleTabClick = (tab: MediaTab) => { playSound('select'); setActiveTab(tab); setShowNextStepNudge(false); setDesigns([]); }
  const previewContainerClasses = activeTab === 'banner' ? 'w-full aspect-[3/1]' : 'w-full max-w-[200px] aspect-[1/3] mx-auto';

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-600 mb-2">Langkah 7: Studio Media Cetak</h2>
        <p className="text-slate-600 max-w-3xl mx-auto">Saatnya bikin amunisi promosi offline! Di sini, Mang AI akan membuatkan template desain (bukan mockup) yang siap cetak. Lo tinggal tambahin tulisan sendiri nanti.</p>
      </div>
      
      <div className="flex flex-wrap border-b border-slate-200">
          <button onClick={() => handleTabClick('banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'banner' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-800'}`}>Spanduk (Horizontal 3:1)</button>
          <button onClick={() => handleTabClick('roll_banner')} className={`px-4 py-3 text-sm md:px-6 md:text-base font-semibold transition-colors ${activeTab === 'roll_banner' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-800'}`}>Roll Banner (Vertikal 1:3)</button>
      </div>

      <Card title={`Desain Template untuk ${activeTab === 'roll_banner' ? 'Roll Banner' : 'Spanduk'}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">Mang AI akan membuatkan desain visual menggunakan logo dan palet warna brand-mu. Desain ini akan memiliki area kosong yang bisa kamu isi dengan tulisan sendiri menggunakan software editing gambar.</p>
             <Button type="submit" isLoading={isLoading} disabled={credits < GENERATION_COST}>{`Bikinin Template Desain! (${GENERATION_COST} Token)`}</Button>
        </form>
      </Card>
      
      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {designs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 pt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
            <div>
                <h4 className="font-bold text-orange-600">Peringatan Penyimpanan Lokal!</h4>
                <p className="text-sm text-orange-800 mt-1">Aset visual ini hanya disimpan sementara di browser. Segera selesaikan dan finalisasi untuk menyimpan progres. <strong>Progres akan hilang jika lo me-refresh atau menutup halaman ini.</strong></p>
            </div>
        </div>
      )}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-800">Desain Hasil Generate:</h3>
          <div className="flex justify-center w-full max-w-3xl animate-item-appear">
            <div className={`bg-white rounded-lg p-2 flex items-center justify-center shadow-lg border-2 border-sky-500 ring-4 ring-sky-500/20 cursor-pointer group ${previewContainerClasses}`} onClick={() => setModalImageUrl(designs[0])}>
                <img src={designs[0]} alt={`Generated mockup for ${activeTab}`} className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
              </div>
          </div>
        </div>
      )}

      <div className="self-center mt-4 relative">
        {showNextStepNudge && (<CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">Mantap! Lanjut ke konten?</CalloutPopup>)}
        <Button onClick={handleContinue} disabled={Object.keys(generatedAssets).length === 0} size="large">Lanjut ke Kalender Konten &rarr;</Button>
      </div>
      
      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText={`Desain Media Cetak untuk ${projectData.brandInputs?.businessName}`} onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default PrintMediaGenerator;