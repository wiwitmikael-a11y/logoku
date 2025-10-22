// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { generateSlogans, generateLogoPrompt, generateLogoOptions, editLogo } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';
import ImageModal from './common/ImageModal';
import Textarea from './common/Textarea';

const SLOGAN_COST = 1;
const LOGO_PROMPT_COST = 1;
const LOGO_GEN_COST = 4;
const LOGO_EDIT_COST = 1;
const XP_REWARD = 150;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
  onComplete: () => void;
}

const LogoGenerator: React.FC<Props> = ({ project, onUpdateProject, onComplete }) => {
  const { deductCredits, addXp } = useUserActions();
  const [isLoading, setIsLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editingLogoUrl, setEditingLogoUrl] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const { brandInputs, selectedPersona, slogans, selectedSlogan, logoPrompt, logoOptions, selectedLogoUrl } = project.project_data;

  const handleGenerateSlogans = async () => {
    if (!brandInputs) return;
    setIsLoading('slogans'); setError(null);
    try {
      if (!(await deductCredits(SLOGAN_COST))) return;
      const newSlogans = await generateSlogans(brandInputs);
      await onUpdateProject({ slogans: newSlogans, selectedSlogan: newSlogans[0] });
      playSound('success');
    } catch (err) { setError((err as Error).message); } 
    finally { setIsLoading(false); }
  };

  const handleGenerateLogoPrompt = async () => {
    if (!selectedSlogan || !selectedPersona) return;
    setIsLoading('prompt'); setError(null);
    try {
      if (!(await deductCredits(LOGO_PROMPT_COST))) return;
      const newPrompt = await generateLogoPrompt(selectedSlogan, selectedPersona);
      await onUpdateProject({ logoPrompt: newPrompt });
    } catch (err) { setError((err as Error).message); } 
    finally { setIsLoading(false); }
  };

  const handleGenerateLogos = async () => {
    if (!logoPrompt) return;
    setIsLoading('logos'); setError(null);
    try {
      if (!(await deductCredits(LOGO_GEN_COST))) return;
      const newLogos = await generateLogoOptions(logoPrompt);
      await onUpdateProject({ logoOptions: newLogos, selectedLogoUrl: newLogos[0] });
      await addXp(XP_REWARD);
    } catch (err) { setError((err as Error).message); } 
    finally { setIsLoading(false); }
  };

  const handleSelectLogo = (url: string) => {
    onUpdateProject({ selectedLogoUrl: url });
    playSound('select');
  };
  
  const handleEditLogo = async () => {
    if (!editingLogoUrl || !editPrompt) return;
    setIsLoading('edit'); setError(null);
    try {
        if (!(await deductCredits(LOGO_EDIT_COST))) return;
        const newLogoUrl = await editLogo(editingLogoUrl, editPrompt);
        
        // Replace the old logo with the new one
        const newLogoOptions = logoOptions.map(url => url === editingLogoUrl ? newLogoUrl : url);
        await onUpdateProject({ logoOptions: newLogoOptions, selectedLogoUrl: newLogoUrl });
        
        setEditingLogoUrl(null);
        setEditPrompt('');
    } catch (err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };


  if (!selectedPersona) {
    return (
        <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
            <span className="text-5xl mb-4">🎨</span>
            <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Persona Dulu!</h2>
            <p className="mt-2 text-text-muted max-w-md">Logo yang bagus itu mencerminkan kepribadian brand. Selesaikan Langkah 1 dulu ya, Juragan!</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full"><span className="text-3xl">🎨</span></div>
        <div>
          <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Langkah 2: Ciptakan Logo Juara</h3>
          <p className="text-sm text-text-body mt-1">Logo itu wajahnya brand. Mang AI akan bantu kamu dari bikin slogan, resep logo (prompt), sampai 4 pilihan desain logo yang bisa kamu pilih dan revisi.</p>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} />}

      {/* Slogan Generation */}
      <div className="p-4 bg-background rounded-lg space-y-3">
        <h4 className="font-semibold text-text-header">2a. Slogan Juara</h4>
        {slogans.length === 0 ? (
          <Button onClick={handleGenerateSlogans} isLoading={isLoading === 'slogans'} disabled={!!isLoading}>Buat Slogan ({SLOGAN_COST} ✨)</Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slogans.map(s => <button key={s} onClick={() => onUpdateProject({ selectedSlogan: s })} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedSlogan === s ? 'bg-primary text-white' : 'bg-surface hover:bg-border-light'}`}>{s}</button>)}
          </div>
        )}
      </div>

      {/* Logo Prompt Generation */}
      {selectedSlogan && (
        <div className="p-4 bg-background rounded-lg space-y-3 animate-content-fade-in">
          <h4 className="font-semibold text-text-header">2b. Resep Logo (Prompt)</h4>
          {logoPrompt ? (
            <p className="text-sm italic text-text-body bg-surface p-2 rounded selectable-text">"{logoPrompt}"</p>
          ) : (
            <Button onClick={handleGenerateLogoPrompt} isLoading={isLoading === 'prompt'} disabled={!!isLoading}>Buat Resep Logo ({LOGO_PROMPT_COST} ✨)</Button>
          )}
        </div>
      )}

      {/* Logo Generation */}
      {logoPrompt && (
        <div className="p-4 bg-background rounded-lg space-y-3 animate-content-fade-in">
          <h4 className="font-semibold text-text-header">2c. Pilihan Desain Logo</h4>
          {logoOptions.length === 0 ? (
             <Button onClick={handleGenerateLogos} isLoading={isLoading === 'logos'} disabled={!!isLoading}>Gambar 4 Opsi Logo! ({LOGO_GEN_COST} ✨)</Button>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {logoOptions.map(url => (
                    <div key={url} className={`relative p-2 rounded-lg cursor-pointer transition-all group ${selectedLogoUrl === url ? 'selection-card-active' : 'selection-card'}`} onClick={() => handleSelectLogo(url)}>
                        <img src={url} alt="logo option" className="w-full aspect-square object-contain bg-white rounded-md"/>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <Button size="small" onClick={(e) => { e.stopPropagation(); setModalImageUrl(url); }}>🔎</Button>
                           <Button size="small" onClick={(e) => { e.stopPropagation(); setEditingLogoUrl(url); }}>✏️</Button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      )}

      {editingLogoUrl && (
        <div className="p-4 bg-background rounded-lg space-y-3 animate-content-fade-in">
             <h4 className="font-semibold text-text-header">Revisi Logo</h4>
             <div className="flex gap-4 items-start">
                <img src={editingLogoUrl} alt="logo to edit" className="w-24 h-24 object-contain bg-white rounded-md"/>
                <Textarea label="Instruksi revisi" name="editPrompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="Contoh: ganti warnanya jadi biru" rows={3} className="flex-grow" />
             </div>
             <div className="flex gap-2">
                <Button onClick={handleEditLogo} isLoading={isLoading === 'edit'} disabled={!editPrompt}>Revisi ({LOGO_EDIT_COST} ✨)</Button>
                <Button onClick={() => setEditingLogoUrl(null)} variant="secondary">Batal</Button>
             </div>
        </div>
      )}
      
      {selectedLogoUrl && (
         <div className="mt-6 pt-6 border-t border-border-main text-center animate-content-fade-in">
            <Button onClick={onComplete} variant="accent">
                Lanjut ke Kit Sosmed →
            </Button>
        </div>
      )}

      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Pratinjau Logo" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default LogoGenerator;