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

interface Props {
  baseLogoUrl: string; // This will now be a Base64 string
  basePrompt: string;
  onComplete: (data: { finalLogoBase64: string; variations: LogoVariations }) => void;
}

const VARIATION_COST = 2;
const EDIT_COST = 1;

const LogoDetailGenerator: React.FC<Props> = ({ baseLogoUrl, basePrompt, onComplete }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [finalLogoBase64, setFinalLogoBase64] = useState<string>(baseLogoUrl);
  const [variations, setVariations] = useState<LogoVariations | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  
  // State for draggable modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
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
      const generatedVariations = await generateLogoVariations(basePrompt);
      await deductCredits(VARIATION_COST);
      const completeVariations = { main: finalLogoBase64, icon: generatedVariations.icon, monochrome: generatedVariations.monochrome };
      setVariations(completeVariations);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat variasi logo.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [basePrompt, finalLogoBase64, credits, deductCredits, setShowOutOfCreditsModal]);

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
      const base64Data = finalLogoBase64.split(',')[1];
      const mimeType = finalLogoBase64.match(/data:(.*);base64/)?.[1] || 'image/png';
      
      const editedBase64Result = await editLogo(base64Data, mimeType, editPrompt);

      await deductCredits(EDIT_COST);
      setFinalLogoBase64(editedBase64Result);
      playSound('success');
      setShowEditModal(false); // Close modal on success
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
        const finalVariations = { ...variations, main: finalLogoBase64 };
        onComplete({ finalLogoBase64, variations: finalVariations });
    }
  };
  
    // --- Draggable Modal Handlers ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragInfo.current.isDragging && modalRef.current) {
      const dx = e.clientX - dragInfo.current.startX;
      const dy = e.clientY - dragInfo.current.startY;
      setModalPosition({
        top: `${dragInfo.current.initialTop + dy}px`,
        left: `${dragInfo.current.initialLeft + dx}px`,
        transform: 'none',
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragInfo.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (modalRef.current) {
        // Get initial position relative to viewport
        const rect = modalRef.current.getBoundingClientRect();
        dragInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: rect.left,
            initialTop: rect.top,
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 3: Finalisasi & Paket Logo</h2>
        <p className="text-gray-400">Logo pilihan lo udah siap. Sekarang lo bisa bikin paket logo lengkap (buat ikon, stempel, dll.) atau kasih revisi minor pakai Mang AI.</p>
      </div>

      <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg md:text-xl font-bold text-center">Logo Utama Lo</h3>
          <div className="mt-4 bg-white p-4 rounded-lg flex justify-center items-center aspect-square max-w-md mx-auto cursor-pointer group" onClick={() => openModal(finalLogoBase64)}>
              <img src={finalLogoBase64} alt="Logo Utama" className="max-w-full max-h-64 object-contain group-hover:scale-105 transition-transform" />
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {!variations ? (
                  <Button onClick={handleGenerateVariations} isLoading={isGeneratingVariations} disabled={credits < VARIATION_COST}>
                      Siapin Paket Komplitnya! ({VARIATION_COST} Kredit)
                  </Button>
              ) : (
                  <p className="text-green-400 font-semibold text-center">✓ Paket logo lengkap sudah dibuat!</p>
              )}
              <Button onClick={() => setShowEditModal(true)} variant="secondary" size="small" disabled={isEditing || isGeneratingVariations}>
                  Revisi Cepat ({EDIT_COST} Kredit)
              </Button>
          </div>
          
          {variations && (
              <div ref={variationsRef} className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="font-bold mb-4 text-center">Paket Logo Lengkap:</h4>
                  <div className="grid grid-cols-2 gap-4 text-center max-w-md mx-auto">
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
          )}
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      {/* Draggable Edit Modal */}
      {showEditModal && (
          <div
              ref={modalRef}
              className="fixed w-full max-w-md bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl z-30"
              style={{ ...modalPosition }}
              role="dialog"
              aria-modal="true"
          >
              <div onMouseDown={handleMouseDown} className="flex justify-between items-center p-4 border-b border-gray-700 cursor-move">
                  <h4 className="font-bold text-indigo-400">Revisi Cepat</h4>
                  <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-white rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              <div className="p-6">
                  <p className="text-sm text-gray-400 mb-4">Kasih perintah simpel buat ubah logo lo. Misal: "ganti warnanya jadi biru dongker" atau "tambahin outline tipis".</p>
                  <form onSubmit={handleEdit} className="flex flex-col gap-4">
                      <Input 
                          label="Perintah Revisi"
                          name="editPrompt"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="cth: Ganti warna merahnya jadi hijau"
                          autoFocus
                      />
                      <div className="self-end">
                          <Button type="submit" isLoading={isEditing} disabled={credits < EDIT_COST}>
                              Revisi, Gercep! ({EDIT_COST} Kredit)
                          </Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

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
