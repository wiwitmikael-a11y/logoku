import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateLogoVariations, editLogo } from '../services/geminiService';
import { uploadImageFromBase64 } from '../services/storageService';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { LogoVariations } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup'; // Import the new component

interface Props {
  baseLogoUrl: string;
  basePrompt: string;
  onComplete: (data: { finalLogoUrl: string; variations: LogoVariations }) => void;
  userId: string;
  projectId: number;
}

const VARIATION_COST = 2;
const EDIT_COST = 1;
const STORAGE_QUOTA_KB = 5 * 1024; // 5MB

const LogoDetailGenerator: React.FC<Props> = ({ baseLogoUrl, basePrompt, onComplete, userId, projectId }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [finalLogoUrl, setFinalLogoUrl] = useState<string>(baseLogoUrl);
  const [variations, setVariations] = useState<LogoVariations | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false); // State for the nudge
  const variationsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    if (variations && variationsRef.current) {
      variationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [variations]);

  const handleGenerateVariations = useCallback(async () => {
    if (profile && profile.storage_used_kb >= STORAGE_QUOTA_KB) {
        setError(`Waduh, gudang penyimpanan lo udah penuh (lebih dari 5MB). Hapus project lama buat ngosongin ruang ya.`);
        playSound('error');
        return;
    }
    if (credits < VARIATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    setIsGeneratingVariations(true);
    setError(null);
    setShowNextStepNudge(false); // Reset nudge
    playSound('start');
    try {
      const generatedVariations = await generateLogoVariations(basePrompt);
      const [iconUrl, monochromeUrl] = await Promise.all([
          uploadImageFromBase64(generatedVariations.icon, userId, projectId, 'logo-icon'),
          uploadImageFromBase64(generatedVariations.monochrome, userId, projectId, 'logo-monochrome')
      ]);

      await deductCredits(VARIATION_COST); // Deduct on success
      const completeVariations = { main: finalLogoUrl, icon: iconUrl, monochrome: monochromeUrl };
      setVariations(completeVariations);
      setShowNextStepNudge(true); // Show nudge on success
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat variasi logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [basePrompt, finalLogoUrl, credits, deductCredits, setShowOutOfCreditsModal, userId, projectId, profile]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile && profile.storage_used_kb >= STORAGE_QUOTA_KB) {
        setError(`Waduh, gudang penyimpanan lo udah penuh (lebih dari 5MB). Hapus project lama buat ngosongin ruang ya.`);
        playSound('error');
        return;
    }
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
      // Fetch current image from Supabase URL and convert back to Base64 for the API
      const currentImageBase64 = await fetchImageAsBase64(finalLogoUrl);
      const base64Data = currentImageBase64.split(',')[1];
      const mimeType = currentImageBase64.match(/data:(.*);base64/)?.[1] || 'image/png';
      
      // Call the edit API with the Base64 data
      const editedBase64Result = await editLogo(base64Data, mimeType, editPrompt);
      
      // Upload the new edited image to Supabase Storage
      const newPublicUrl = await uploadImageFromBase64(editedBase64Result, userId, projectId, 'logo-edited');

      await deductCredits(EDIT_COST); // Deduct on success
      setFinalLogoUrl(newPublicUrl); // Update the main displayed logo with the new public URL
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengedit logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleContinue = () => {
    if (variations) {
        // Ensure the final selected logo (potentially edited) is set as the 'main' in variations
        const finalVariations = { ...variations, main: finalLogoUrl };
        onComplete({ finalLogoUrl, variations: finalVariations });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 3: Finalisasi & Paket Logo</h2>
        <p className="text-gray-400">Logo pilihan lo udah siap. Sekarang lo bisa bikin paket logo lengkap (buat ikon, stempel, dll.) atau kasih revisi minor pakai Mang AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Logo Preview & Variations */}
        <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold">Logo Utama Lo</h3>
            <div className="bg-white p-4 rounded-lg flex justify-center items-center aspect-square cursor-pointer group" onClick={() => openModal(finalLogoUrl)}>
                <img src={finalLogoUrl} alt="Logo Utama" className="max-w-full max-h-64 object-contain group-hover:scale-105 transition-transform" />
            </div>

            {variations ? (
                <div ref={variationsRef}>
                    <h4 className="font-bold mb-4">Paket Logo Lengkap:</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(variations.icon)}>
                                <img src={variations.icon} alt="Ikon Logo" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                            </div>
                            <p className="text-sm mt-2 text-gray-400">Versi Ikon</p>
                        </div>
                         <div>
                            <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(variations.monochrome)}>
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

        {/* AI Edit Section */}
        <div className="flex flex-col gap-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold">Revisi Cepat dengan Mang AI</h3>
            <p className="text-sm text-gray-400">Kasih perintah simpel buat ubah logo lo. Misal: "ganti warnanya jadi biru dongker" atau "tambahin outline tipis".</p>
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