import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCaptions, generateSocialMediaPostImage } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData, GeneratedCaption } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Card from './common/Card';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';
import LoadingMessage from './common/LoadingMessage';

interface Props {
  projectData: Partial<ProjectData>;
  onBack: () => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 2; // 1 for image, 1 for captions

interface GeneratedContent {
    imageUrl: string;
    captions: GeneratedCaption[];
}

const InstantContentGenerator: React.FC<Props> = ({ projectData, onBack, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    if (generatedContent && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedContent]);

  const handleSubmit = useCallback(async () => {
    const { brandInputs, selectedPersona } = projectData;
    if (!topic || !brandInputs || !selectedPersona) return;

     if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    playSound('start');

    try {
      const [imageResult, captionsResult] = await Promise.all([
        generateSocialMediaPostImage(topic, selectedPersona.kata_kunci),
        generateCaptions(brandInputs.businessName, selectedPersona, topic, "Promosi") // Default tone to "Promosi"
      ]);

      if (!imageResult || imageResult.length === 0) {
        throw new Error("Mang AI gagal membuat gambar untuk konten ini.");
      }

      await deductCredits(GENERATION_COST);
      
      setGeneratedContent({
          imageUrl: imageResult[0],
          captions: captionsResult,
      });

      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, topic, credits, deductCredits, setShowOutOfCreditsModal]);


  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Generator Konten Instan</h2>
        <p className="text-gray-400">
          Ubah ide jadi konten siap posting dalam sekejap! Cukup kasih topik, Mang AI bakal bikinin gambar + caption yang pas sama brand "{projectData.selectedPersona?.nama_persona}" lo.
        </p>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <Textarea
          label="Ide atau Topik Postingan Hari Ini"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="cth: Promo Beli 1 Gratis 1 Kopi Susu, atau 'Selamat Hari Senin, tetap semangat!'"
          rows={3}
        />
      </div>
      
       <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!topic.trim() || credits < GENERATION_COST}>
            Buatin Kontennya, Mang! ({GENERATION_COST} Kredit)
          </Button>
           <Button onClick={onBack} variant="secondary">
            &larr; Kembali ke Ringkasan
          </Button>
        </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {isLoading && !generatedContent && (
        <div className="flex justify-center items-center p-8"><LoadingMessage /></div>
      )}

      {generatedContent && (
        <div ref={resultsRef} className="flex flex-col gap-8 mt-4 scroll-mt-24">
          <h3 className="text-lg md:text-xl font-bold">Konten Siap Posting Buat Lo:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Column */}
            <div className="flex flex-col gap-4">
                <h4 className="font-semibold text-gray-200">Visual Konten:</h4>
                <div 
                    className="bg-white rounded-lg p-2 aspect-square flex items-center justify-center shadow-lg w-full cursor-pointer group"
                    onClick={() => openModal(generatedContent.imageUrl)}
                >
                    <img src={generatedContent.imageUrl} alt="Generated content visual" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
                </div>
            </div>

            {/* Captions Column */}
            <div className="flex flex-col gap-4">
                <h4 className="font-semibold text-gray-200">Pilihan Caption:</h4>
                {generatedContent.captions.map((item, index) => (
                  <Card key={index} title={`Opsi Caption ${index + 1}`} className="bg-gray-800/50">
                     <div className="space-y-3">
                        <div className="relative">
                             <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10">{item.caption}</p>
                             <CopyButton textToCopy={item.caption} className="absolute top-0 right-0"/>
                        </div>
                        <div className="relative border-t border-gray-700 pt-3">
                            <p className="text-indigo-300 text-xs break-words pr-10">{item.hashtags.join(' ')}</p>
                            <CopyButton textToCopy={item.hashtags.join(' ')} className="absolute top-0 right-0"/>
                        </div>
                     </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText="Preview Visual Konten"
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default InstantContentGenerator;