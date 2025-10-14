// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateContentCalendar, generateSocialMediaPostImage } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import type { ContentCalendarEntry, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';
import CalloutPopup from './common/CalloutPopup';
import CopyButton from './common/CopyButton';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { calendar: ContentCalendarEntry[], sources: any[] }) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 1;

const ContentCalendarGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const credits = profile?.credits ?? 0;

  const [calendar, setCalendar] = useState<ContentCalendarEntry[]>(projectData.contentCalendar || []);
  const [sources, setSources] = useState<any[]>(projectData.searchSources || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  
  const [generatingImageForIndex, setGeneratingImageForIndex] = useState<number | null>(null);
  const [imageGenError, setImageGenError] = useState<{ index: number; message: string } | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (calendar.length > 0 && resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [calendar]);

  const handleSubmit = useCallback(async () => {
    if (!projectData.brandInputs || !projectData.selectedPersona) return;
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); return; }
    setIsLoading(true);
    setError(null);
    setCalendar([]);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      if (!(await deductCredits(GENERATION_COST))) return;
      // FIX: Pass null for the petState argument to match the function signature.
      const result = await generateContentCalendar(projectData.brandInputs.businessName, projectData.selectedPersona, null);
      setCalendar(result.calendar);
      setSources(result.sources);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, credits, deductCredits, setShowOutOfCreditsModal]);
  
  const handleGenerateImage = useCallback(async (index: number) => {
    if (credits < GENERATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    if (!projectData.selectedPersona?.kata_kunci || !calendar[index]?.ide_konten) {
        setError("Data persona atau ide konten tidak lengkap.");
        return;
    }

    setGeneratingImageForIndex(index);
    setImageGenError(null);
    playSound('start');

    try {
        const { ide_konten } = calendar[index];
        const { kata_kunci } = projectData.selectedPersona;
        const imageResults = await generateSocialMediaPostImage(ide_konten, kata_kunci);
        if (!(await deductCredits(GENERATION_COST))) return;
        const newCalendar = [...calendar];
        newCalendar[index] = { ...newCalendar[index], imageUrl: imageResults[0] };
        setCalendar(newCalendar);
        playSound('success');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal membuat gambar.';
        setImageGenError({ index, message: errorMessage });
        playSound('error');
    } finally {
        setGeneratingImageForIndex(null);
    }
  }, [calendar, credits, projectData, deductCredits, setShowOutOfCreditsModal]);

  const handleContinue = () => { onComplete({ calendar, sources }); };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 8: Rencana Konten Sosmed</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Stop bingung mau posting apa. Mang AI akan meriset tren terbaru di Google untuk membuatkan draf kalender konten selama 7 hari, lengkap dengan ide, caption, dan hashtag yang relevan.</p>
      </div>

      <div className="self-center">
        <Button onClick={handleSubmit} isLoading={isLoading} disabled={credits < GENERATION_COST} size="large">Kasih Ide Konten, Please! ({GENERATION_COST} Token)</Button>
      </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {calendar.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 pt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
            <div>
                <h4 className="font-bold text-accent">Peringatan Penyimpanan Lokal!</h4>
                <p className="text-sm text-accent/80 mt-1">Aset visual ini hanya disimpan sementara di browser. Segera selesaikan dan lanjutkan untuk menyimpan progres. <strong>Progres akan hilang jika lo me-refresh atau menutup halaman ini.</strong></p>
            </div>
        </div>
      )}

      {calendar.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 scroll-mt-24">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-text-header">Draf Kalender Konten Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendar.map((item, index) => (
              <Card key={index} title={<><span className="font-normal text-text-muted">{item.hari} - </span>{item.tipe_konten}</>} className="relative animate-item-appear" style={{animationDelay: `${index*100}ms`}}>
                 <CopyButton textToCopy={`Ide Konten: ${item.ide_konten}\n\nDraf Caption:\n${item.draf_caption}\n\nRekomendasi Hashtag:\n${item.rekomendasi_hashtag.join(' ')}`} className="absolute top-4 right-4 z-10" title="Salin semua info hari ini"/>
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-text-header text-sm mb-1">Ide Konten:</h4>
                        <p className="text-text-body text-sm selectable-text">{item.ide_konten}</p>
                    </div>
                    <div className="relative border-t border-border-main pt-3">
                         <h4 className="font-semibold text-text-header text-sm mb-1">Draf Caption:</h4>
                         <p className="text-text-body whitespace-pre-wrap text-sm pr-10 selectable-text">{item.draf_caption}</p>
                         <CopyButton textToCopy={item.draf_caption} className="absolute top-2 right-0"/>
                    </div>
                    <div className="relative border-t border-border-main pt-3">
                        <h4 className="font-semibold text-text-header text-sm mb-1">Hashtag:</h4>
                        <p className="text-primary text-xs break-words pr-10 selectable-text">{item.rekomendasi_hashtag.join(' ')}</p>
                        <CopyButton textToCopy={item.rekomendasi_hashtag.join(' ')} className="absolute top-2 right-0"/>
                    </div>
                    <div className="border-t border-border-main pt-3">
                        <h4 className="font-semibold text-text-header text-sm mb-2">Aset Visual Postingan</h4>
                        {item.imageUrl ? (
                            <div className="bg-background p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => setModalImageUrl(item.imageUrl!)}>
                                <img src={item.imageUrl} alt={`Visual untuk ${item.ide_konten}`} className="max-w-full max-h-48 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                        ) : generatingImageForIndex === index ? (
                            <div className="flex justify-center items-center h-24"><LoadingMessage /></div>
                        ) : (
                            <div className="flex flex-col items-start">
                                <Button size="small" onClick={() => handleGenerateImage(index)} disabled={credits < GENERATION_COST || generatingImageForIndex !== null}>Buat Gambar ({GENERATION_COST} Token)</Button>
                                {imageGenError?.index === index && (<p className="text-xs text-red-500 mt-2">{imageGenError.message}</p>)}
                            </div>
                        )}
                    </div>
                 </div>
              </Card>
            ))}
          </div>

          {sources.length > 0 && (
             <div className="mt-4">
                <h4 className="font-semibold text-text-header mb-2">Sumber dari Google Search:</h4>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, i) => source.web && (<a href={source.web.uri} key={i} target="_blank" rel="noopener noreferrer" className="bg-surface hover:bg-background text-text-body text-xs font-medium px-2.5 py-1 rounded-full transition-colors">{source.web.title}</a>))}
                </div>
             </div>
          )}

          <div className="self-center mt-4 relative">
             {showNextStepNudge && (<CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Ide konten siap! Lanjut, bro?</CalloutPopup>)}
            <Button onClick={handleContinue} size="large">Lanjut ke Iklan Sosmed &rarr;</Button>
          </div>
        </div>
      )}

      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText="Preview Gambar Postingan" onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default ContentCalendarGenerator;