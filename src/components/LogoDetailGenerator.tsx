// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateLogoVariations, editLogo } from '../../services/geminiService';
import { playSound } from '../../services/soundService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserActions } from '../../contexts/UserActionsContext';
import type { LogoVariations } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingMessage from '../../components/common/LoadingMessage';
import ImageModal from '../../components/common/ImageModal';
import ErrorMessage from '../../components/common/ErrorMessage';
import CalloutPopup from '../../components/common/CalloutPopup';
import Card from '../../components/common/Card';

interface Props {
  baseLogoUrl: string;
  basePrompt: string;
  businessName: string;
  onComplete: (data: { finalLogoUrl: string; variations: LogoVariations }) => void;
  onGoToDashboard: () => void;
}

const VARIATION_COST = 3;
const EDIT_COST = 1;

const LogoDetailGenerator: React.FC<Props> = ({ baseLogoUrl, businessName, onComplete, onGoToDashboard }) => {
  const { profile } = useAuth();
  const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
  const credits = profile?.credits ?? 0;

  const [finalLogoUrl, setFinalLogoUrl] = useState<string>(baseLogoUrl);
  const [history, setHistory] = useState<string[]>([]);
  const [variations, setVariations] = useState<LogoVariations | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const variationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Preload next step
    import('../../components/SocialMediaKitGenerator');
  }, []);

  useEffect(() => {
    if (variations && variationsRef.current) {
      variationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [variations]);

  const handleGenerateVariations = useCallback(async () => {
    if (credits < VARIATION_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    setIsGeneratingVariations(true);
    setError(null);
    setShowNextStepNudge(false);
    playSound('start');
    try {
      const generatedVariations = await generateLogoVariations(finalLogoUrl, businessName);
      await deductCredits(VARIATION_COST);
      setVariations(generatedVariations);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat variasi logo.');
      playSound('error');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [finalLogoUrl, businessName, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credits < EDIT_COST) { setShowOutOfCreditsModal(true); playSound('error'); return; }
    if (!editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);
    playSound('start');
    try {
      setHistory(prev => [...prev, finalLogoUrl]); // Save current state before editing
      const base64Data = finalLogoUrl.split(',')[1];
      const mimeType = finalLogoUrl.match(/data:(.*);base64/)?.[1] || 'image/png';
      const editedBase64Result = await editLogo(base64Data, mimeType, editPrompt);
      await deductCredits(EDIT_COST);
      setFinalLogoUrl(editedBase64Result);
      setVariations(null); // Invalidate variations after edit
      setShowNextStepNudge(false);
      setEditPrompt('');
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengedit logo.');
      setHistory(prev => prev.slice(0, -1)); // Revert history on error
      playSound('error');
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleUndo = () => {
    if (history.length === 0) return;
    playSound('click');
    const lastVersion = history[history.length - 1];
    setFinalLogoUrl(lastVersion);
    setHistory(prev => prev.slice(0, -1));
    setVariations(null);
    setShowNextStepNudge(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 3: Finalisasi Logo</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Logo utamamu sudah siap. Di sini lo bisa sedikit poles lagi pake prompt, atau langsung bikin variasinya (versi tumpuk, datar, & hitam-putih).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card title="Logo Utama (Icon)">
          <div className="flex flex-col gap-4 items-center">
            <div className="bg-background p-4 rounded-lg w-full max-w-xs aspect-square flex items-center justify-center cursor-pointer group" onClick={() => setModalImageUrl(finalLogoUrl)}>
              <img src={finalLogoUrl} alt="Logo saat ini" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
            </div>
            {history.length > 0 && <Button onClick={handleUndo} size="small" variant="secondary">Undo Edit Terakhir</Button>}
            <form onSubmit={handleEdit} className="w-full space-y-2 pt-4 border-t border-border-main">
              <label className="text-sm font-semibold text-text-header">Poles Lagi (Opsional)</label>
              <Input label="" name="editPrompt" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="cth: ganti warnanya jadi biru tua" />
              <Button type="submit" isLoading={isEditing} disabled={!editPrompt.trim() || credits < EDIT_COST} size="small">Jalankan Perintah! ({EDIT_COST} Token)</Button>
            </form>
          </div>
        </Card>
        
        <Card title="Variasi Logo" ref={variationsRef}>
          {isGeneratingVariations ? (
            <div className="h-64 flex items-center justify-center"><LoadingMessage /></div>
          ) : variations ? (
            <div className="grid grid-cols-2 gap-4 text-center animate-content-fade-in">
              <div><h4 className="font-semibold text-sm mb-1">Tumpuk</h4><div className="bg-background p-2 rounded-lg cursor-pointer" onClick={() => setModalImageUrl(variations.stacked)}><img src={variations.stacked} alt="Stacked Logo" className="w-full" /></div></div>
              <div><h4 className="font-semibold text-sm mb-1">Datar</h4><div className="bg-background p-2 rounded-lg cursor-pointer" onClick={() => setModalImageUrl(variations.horizontal)}><img src={variations.horizontal} alt="Horizontal Logo" className="w-full" /></div></div>
              <div className="col-span-2"><h4 className="font-semibold text-sm mb-1">Monokrom</h4><div className="bg-background p-2 rounded-lg cursor-pointer" onClick={() => setModalImageUrl(variations.monochrome)}><img src={variations.monochrome} alt="Monochrome Logo" className="w-full" /></div></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center text-center">
              <p className="text-sm text-text-muted">Kalau logo utamanya udah oke, klik tombol di bawah buat generate variasi lainnya (logo dengan teks).</p>
              <Button onClick={handleGenerateVariations} isLoading={isGeneratingVariations} disabled={credits < VARIATION_COST}>Buat 3 Variasi Logo ({VARIATION_COST} Token)</Button>
            </div>
          )}
        </Card>
      </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}
      
      {variations && (
        <div className="self-center mt-4 relative">
          {showNextStepNudge && <CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Sip! Paket logo lengkap!</CalloutPopup>}
          <Button onClick={() => onComplete({ finalLogoUrl, variations })} size="large">Keren, Lanjut ke Social Media Kit &rarr;</Button>
        </div>
      )}

      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Preview Varian Logo" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default LogoDetailGenerator;