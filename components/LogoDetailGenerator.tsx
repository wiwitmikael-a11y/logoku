

import React, { useState, useCallback } from 'react';
import { generateLogoVariations, editLogo } from '../services/geminiService';
import { playSound } from '../services/soundService';
import type { LogoVariations } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';

interface Props {
  baseLogoUrl: string;
  basePrompt: string;
  onComplete: (data: { finalLogoUrl: string; variations: LogoVariations }) => void;
}

const LogoDetailGenerator: React.FC<Props> = ({ baseLogoUrl, basePrompt, onComplete }) => {
  const [finalLogoUrl, setFinalLogoUrl] = useState<string>(baseLogoUrl);
  const [variations, setVariations] = useState<LogoVariations | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  const handleGenerateVariations = useCallback(async () => {
    setIsGeneratingVariations(true);
    setError(null);
    playSound('start');
    try {
      // Pass the original selected logo as the "main" variant to save an API call
      const generatedVariations = await generateLogoVariations(basePrompt);
      const completeVariations = { ...generatedVariations, main: baseLogoUrl };
      setVariations(completeVariations);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat variasi logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [basePrompt, baseLogoUrl]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);
    playSound('start');
    try {
      const base64Data = finalLogoUrl.split(',')[1];
      const mimeType = finalLogoUrl.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      const result = await editLogo(base64Data, mimeType, editPrompt);
      setFinalLogoUrl(result); // Update the main displayed logo with the edited one
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
                <div>
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
                <Button onClick={handleGenerateVariations} isLoading={isGeneratingVariations}>
                    Siapin Paket Komplitnya!
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
                    <Button type="submit" isLoading={isEditing}>
                        Revisi, Gercep!
                    </Button>
                </div>
            </form>
        </div>
      </div>

      {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg mt-4">{error}</div>}

      <div className="self-center mt-6">
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