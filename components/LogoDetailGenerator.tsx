
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateLogoVariations, editLogo } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { LogoVariations } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';

interface Props {
  baseLogoUrl: string;
  basePrompt: string;
  businessName: string;
  onComplete: (data: { finalLogoUrl: string; variations: LogoVariations }) => void;
}

const VARIATION_COST = 2;
const EDIT_COST = 1;

// FIX: This component was using an outdated implementation. It has been updated to align with the newer components.
// It now correctly calls geminiService functions with the expected arguments and handles data flow properly.
const LogoDetailGenerator: React.FC<Props> = ({ baseLogoUrl, basePrompt, businessName, onComplete }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [finalLogoUrl, setFinalLogoUrl] = useState<string>(baseLogoUrl);
  const [variations, setVariations] = useState<LogoVariations | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const variationsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    if (variations && variationsRef.current) {
      variationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [variations]);

  const handleGenerateVariations = useCallback(async () => {
    if (credits < VARIATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsGeneratingVariations(true);
    setError(null);
    setShowNextStepNudge(false);
    playSound('start');
    try {
      // FIX: The API expects base64 data. Fetch the image content as base64 before passing it to the service.
      const logoBase64 = await fetchImageAsBase64(finalLogoUrl);

      // FIX: Call generateLogoVariations with the correct two arguments: base64 logo data and the business name.
      // This resolves the "Expected 2 arguments, but got 1" error.
      const generatedVariations = await generateLogoVariations(logoBase64, businessName);
      
      await deductCredits(VARIATION_COST);
      
      // FIX: The returned object `generatedVariations` now correctly matches the `LogoVariations` type.
      // This resolves the "Property 'icon' does not exist" error.
      setVariations(generatedVariations);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat variasi logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [finalLogoUrl, businessName, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credits < EDIT_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }
    if (!editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);
    playSound('start');
    try {
      const imageAsBase64 = await fetchImageAsBase64(finalLogoUrl);
      const base64Data = imageAsBase64.split(',')[1];
      const mimeType = imageAsBase64.match(/data:(.*);base64/)?.[1] || 'image/png';
      
      const editedBase64Result = await editLogo(base64Data, mimeType, editPrompt);
      
      await deductCredits(EDIT_COST);
      setFinalLogoUrl(editedBase64Result);
      setVariations(null);
      setShowNextStepNudge(false);
      playSound('success');
    } catch (err)
     {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengedit logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleContinue = () => {
    if (variations) {
        const finalVariations = { ...variations, main: finalLogoUrl };
        onComplete({ finalLogoUrl, variations: finalVariations });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 3: Finalisasi & Paket Logo</h2>
        <p className="text-gray-400">Logo pilihan lo udah siap. Sekarang lo bisa bikin paket logo lengkap (versi tumpuk, datar, monokrom) atau kasih revisi minor pakai Mang AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold">Logo Utama (Ikon)</h3>
            <div
              className="relative bg-white p-4 rounded-lg flex justify-center items-center aspect-square group"
              onClick={() => !isEditing && openModal(finalLogoUrl)}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo Utama" 
                className={`max-w-full max-h-64 object-contain transition-all duration-300 ${isEditing ? 'opacity-40 filter blur-sm' : 'group-hover:scale-105 cursor-pointer'}`} 
              />
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm bg-black/10">
                  <LoadingMessage />
                </div>
              )}
            </div>

            {variations ? (
                <div ref={variationsRef}>
                    <h4 className="font-bold mb-4">Paket Logo Lengkap:</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(variations.stacked)}>
                                <img src={variations.stacked} alt="Logo Versi Tumpuk" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                            <p className="text-sm mt-2 text-gray-400">Versi Tumpuk</p>
                        </div>
                         <div>
                            <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(variations.horizontal)}>
                                <img src={variations.horizontal} alt="Logo Versi Datar" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                            <p className="text-sm mt-2 text-gray-400">Versi Datar</p>
                        </div>
                         <div className="col-span-2">
                            <div className="bg-white p-2 rounded-lg flex justify-center items-center cursor-pointer group" onClick={() => openModal(variations.monochrome)}>
                                <img src={variations.monochrome} alt="Logo Monokrom" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                            <p className="text-sm mt-2 text-gray-400">Versi Monokrom</p>
                        </div>
                    </div>
                </div>
            ) : (
                <Button onClick={handleGenerateVariations} isLoading={isGeneratingVariations} disabled={credits < VARIATION_COST}>
                    Siapin Paket Komplitnya! ({VARIATION_COST} Kredit)
                </Button>
            )}
        </div>

        <div className="flex flex-col gap-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold">Revisi Cepat dengan Mang AI</h3>
            <p className="text-sm text-gray-400">Kasih perintah simpel buat ubah logo lo. Misal: "ganti warnanya jadi biru dongker" atau "tambahin outline tipis". Mengedit logo akan menghapus variasi yang sudah dibuat.</p>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
                <Input 
                    label="Perintah Revisi"
                    name="editPrompt"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="cth: Ganti warna merahnya jadi hijau"
                />
                <div className="self-start">
                    <Button type="submit" isLoading={isEditing} disabled={credits < EDIT_COST}>
                        Revisi, Gercep! ({EDIT_COST} Kredit)
                    </Button>
                </div>
            </form>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      <div className="self-center mt-6 relative">
        {showNextStepNudge && (
            <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Paket logo beres! Lanjut?
            </CalloutPopup>
        )}
        <Button onClick={handleContinue} disabled={!variations}>
            Logo Beres, Lanjut ke Konten &rarr;
        </Button>
      </div>

      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          altText="Detail Logo"
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default LogoDetailGenerator;
