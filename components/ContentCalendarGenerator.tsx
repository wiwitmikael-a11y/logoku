import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateContentCalendar, generateSocialMediaPostImage } from '../services/geminiService';
import { uploadImageFromBase64 } from '../services/storageService';
import { playSound } from '../services/soundService';
import { useAuth, STORAGE_QUOTA_KB } from '../contexts/AuthContext';
import type { ContentCalendarEntry, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';
import CalloutPopup from './common/CalloutPopup'; // Import the new component

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (data: { calendar: ContentCalendarEntry[], sources: any[] }) => void;
  userId: string;
  projectId: number;
}

const GENERATION_COST = 1;

const ContentCalendarGenerator: React.FC<Props> = ({ projectData, onComplete, userId, projectId }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [calendar, setCalendar] = useState<ContentCalendarEntry[]>(projectData.contentCalendar || []);
  const [sources, setSources] = useState<any[]>(projectData.searchSources || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false); // State for the nudge
  
  const [generatingImageForIndex, setGeneratingImageForIndex] = useState<number | null>(null);
  const [imageGenError, setImageGenError] = useState<{ index: number; message: string } | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    if (calendar.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [calendar]);

  const handleSubmit = useCallback(async () => {
    if (!projectData.brandInputs || !projectData.selectedPersona) return;
    setIsLoading(true);
    setError(null);
    setCalendar([]);
    setShowNextStepNudge(false); // Reset nudge
    playSound('start');

    try {
      const result = await generateContentCalendar(
        projectData.brandInputs.businessName,
        projectData.selectedPersona
      );
      setCalendar(result.calendar);
      setSources(result.sources);
      setShowNextStepNudge(true); // Show nudge on success
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData]);
  
  const handleGenerateImage = useCallback(async (index: number) => {
    if (profile && profile.storage_used_kb >= STORAGE_QUOTA_KB) {
        setImageGenError({ index, message: `Penyimpanan lo penuh (lebih dari 5MB). Hapus project lama dulu ya.` });
        playSound('error');
        return;
    }
    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }
    if (!projectData.selectedPersona?.kata_kunci || !calendar[index]?.ide_konten) {
        setError("Data persona atau ide konten tidak lengkap untuk membuat gambar.");
        return;
    }

    setGeneratingImageForIndex(index);
    setImageGenError(null);
    playSound('start');

    try {
        const { ide_konten } = calendar[index];
        const { kata_kunci } = projectData.selectedPersona;

        const imageResults = await generateSocialMediaPostImage(ide_konten, kata_kunci);
        const uploadedUrl = await uploadImageFromBase64(imageResults[0], userId, projectId, `social-post-${index}`);
        
        await deductCredits(GENERATION_COST);

        const newCalendar = [...calendar];
        newCalendar[index] = { ...newCalendar[index], imageUrl: uploadedUrl };
        setCalendar(newCalendar);

        playSound('success');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal membuat gambar.';
        setImageGenError({ index, message: errorMessage });
        playSound('error');
    } finally {
        setGeneratingImageForIndex(null);
    }
  }, [calendar, credits, projectData, deductCredits, setShowOutOfCreditsModal, userId, projectId, profile]);

  const handleContinue = () => {
    onComplete({ calendar, sources });
  };

  const copyToClipboard = (text: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 4: Rencana Konten Sosmed</h2>
        <p className="text-gray-400">Stop bingung mau posting apa. Biar Mang AI yang bikinin draf kalender konten seminggu, lengkap sama ide, caption, hashtag, dan referensi tren terbaru dari Google. Sekarang, lo juga bisa langsung bikin visualnya!</p>
      </div>

      <div className="self-center">
        <Button onClick={handleSubmit} isLoading={isLoading}>
          Kasih Ide Konten, Please!
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {calendar.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 scroll-mt-24">
          <h3 className="text-lg md:text-xl font-bold">Draf Kalender Konten Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendar.map((item, index) => (
              <Card key={index} title={`${item.hari} - ${item.tipe_konten}`}>
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-200 text-sm mb-1">Ide Konten:</h4>
                        <p className="text-gray-300 text-sm">{item.ide_konten}</p>
                    </div>
                    <div className="relative border-t border-gray-700 pt-3">
                         <h4 className="font-semibold text-gray-200 text-sm mb-1">Draf Caption:</h4>
                         <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10">{item.draf_caption}</p>
                         <button onClick={() => copyToClipboard(item.draf_caption)} title="Salin caption" className="absolute top-2 right-0 p-1 text-gray-400 hover:text-indigo-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                        </button>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                        <h4 className="font-semibold text-gray-200 text-sm mb-1">Hashtag:</h4>
                        <p className="text-indigo-300 text-xs break-words">{item.rekomendasi_hashtag.join(' ')}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                        <h4 className="font-semibold text-gray-200 text-sm mb-2">Aset Visual Postingan</h4>
                        {item.imageUrl ? (
                            <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(item.imageUrl!)}>
                                <img src={item.imageUrl} alt={`Visual untuk ${item.ide_konten}`} className="max-w-full max-h-48 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                        ) : generatingImageForIndex === index ? (
                            <div className="flex justify-center items-center h-24">
                                <LoadingMessage />
                            </div>
                        ) : (
                            <div className="flex flex-col items-start">
                                <Button 
                                    size="small" 
                                    onClick={() => handleGenerateImage(index)}
                                    disabled={credits < GENERATION_COST || generatingImageForIndex !== null}
                                >
                                    Buat Gambar ({GENERATION_COST} Kredit)
                                </Button>
                                {imageGenError?.index === index && (
                                    <p className="text-xs text-red-400 mt-2">{imageGenError.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
              </Card>
            ))}
          </div>

          {sources.length > 0 && (
             <div className="mt-4">
                <h4 className="font-semibold text-gray-200 mb-2">Sumber dari Google Search:</h4>
                <div className="flex flex-wrap gap-2">
                    {sources.map((source, i) => source.web && (
                        <a href={source.web.uri} key={i} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full transition-colors">{source.web.title}</a>
                    ))}
                </div>
             </div>
          )}

          <div className="self-center mt-4 relative">
             {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Ide konten siap! Lanjut, bro?
              </CalloutPopup>
            )}
            <Button onClick={handleContinue}>
              Lanjut ke Media Cetak &rarr;
            </Button>
          </div>
        </div>
      )}

        {modalImageUrl && (
            <ImageModal 
            imageUrl={modalImageUrl}
            altText="Preview Gambar Postingan"
            onClose={closeModal}
            />
        )}
    </div>
  );
};

export default ContentCalendarGenerator;