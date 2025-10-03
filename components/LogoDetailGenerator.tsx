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
import Card from './common/Card';

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
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
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


  const handleContinue = () => {
    if (variations) {
      const finalVariations = { ...variations, main: finalLogoUrl };
      onComplete({ finalLogoUrl, variations: finalVariations });
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Langkah 3: Finalisasi & Paket Logo</h2>
        <p className="text-text-muted max-w-3xl mx-auto">Logo utama (ikon) sudah jadi. Sekarang lo bisa langsung membuat paket logo lengkap (versi tumpuk, datar, & monokrom) atau memberikan revisi minor pada logo utama menggunakan AI.</p>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-4 text-left">
          <div className="flex-shrink-0 pt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
          <div>
              <h4 className="font-bold text-accent">Peringatan Penyimpanan Lokal!</h4>
              <p className="text-sm text-accent/80 mt-1">Logo dan variasinya hanya disimpan sementara. Selesaikan langkah ini dengan menekan tombol "Lanjut" di bawah untuk menyimpan progres. <strong>Progres akan hilang jika lo me-refresh halaman.</strong></p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card title="Logo Utama & Variasi" className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-header">Logo Utama (Ikon)</h3>
            <div className="relative bg-background p-4 rounded-lg flex justify-center items-center aspect-square group" onClick={() => !isEditing && setModalImageUrl(finalLogoUrl)}>
              <img src={finalLogoUrl} alt="Logo Utama" className={`max-w-full max-h-64 object-contain transition-all duration-300 ${isEditing ? 'opacity-40 filter blur-sm' : 'group-hover:scale-105 cursor-pointer'}`} />
              {isEditing && (<div className="absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm bg-surface/10"><LoadingMessage /></div>)}
            </div>

            {variations ? (
                <div ref={variationsRef} className="animate-content-fade-in pt-6 border-t border-border-main">
                    <h4 className="font-bold mb-4 text-text-header">Paket Logo Lengkap:</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="animate-item-appear"><div className="bg-background p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => setModalImageUrl(variations.stacked)}><img src={variations.stacked} alt="Logo Versi Tumpuk" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/></div><p className="text-sm mt-2 text-text-muted">Versi Tumpuk</p></div>
                        <div className="animate-item-appear" style={{animationDelay: '100ms'}}><div className="bg-background p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => setModalImageUrl(variations.horizontal)}><img src={variations.horizontal} alt="Logo Versi Datar" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/></div><p className="text-sm mt-2 text-text-muted">Versi Datar</p></div>
                        <div className="col-span-2 animate-item-appear" style={{animationDelay: '200ms'}}><div className="bg-background p-2 rounded-lg flex justify-center items-center cursor-pointer group" onClick={() => setModalImageUrl(variations.monochrome)}><img src={variations.monochrome} alt="Logo Monokrom" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/></div><p className="text-sm mt-2 text-text-muted">Versi Monokrom</p></div>
                    </div>
                </div>
            ) : (
                <Button onClick={handleGenerateVariations} isLoading={isGeneratingVariations} disabled={credits < VARIATION_COST} className="w-full">Siapin Paket Komplitnya! ({VARIATION_COST} Token)</Button>
            )}
        </Card>

        <Card title="Revisi Cepat dengan Mang AI" className="p-4 sm:p-6">
            <p className="text-sm text-text-muted mb-4">Kasih perintah simpel buat ubah logo lo. Misal: "ganti warnanya jadi biru dongker" atau "tambahin outline tipis". Mengedit logo akan menghapus variasi yang sudah dibuat.</p>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
                <Input label="Perintah Revisi" name="editPrompt" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="cth: Ganti warna merahnya jadi hijau" />
                <div className="self-start pt-2 flex items-center gap-3">
                    <Button type="submit" isLoading={isEditing} disabled={credits < EDIT_COST} variant="secondary">Revisi, Gercep! ({EDIT_COST} Token)</Button>
                    <Button type="button" onClick={handleUndo} disabled={history.length === 0 || isEditing} variant="secondary" title="Kembali ke versi sebelumnya">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        Undo
                    </Button>
                </div>
            </form>
        </Card>
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} onGoToDashboard={onGoToDashboard} /></div>}

      <div className="self-center mt-6 relative">
        {showNextStepNudge && (<CalloutPopup className="absolute bottom-full left-1/2 -translate-x-1/2 w-max animate-fade-in">Paket logo beres! Lanjut?</CalloutPopup>)}
        <Button onClick={handleContinue} disabled={!variations} size="large">Lanjut ke Social Media Kit &rarr;</Button>
      </div>

      {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText="Detail Logo" onClose={() => setModalImageUrl(null)} />)}
    </div>
  );
};

export default LogoDetailGenerator;
