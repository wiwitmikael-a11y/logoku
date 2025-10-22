// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import { generateLogoPrompt, generateLogoOptions, editLogo } from '../services/geminiService';
import type { Project, ProjectData } from '../types';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Select from './common/Select';
import ErrorMessage from './common/ErrorMessage';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import Input from './common/Input';

const LOGO_PROMPT_COST = 2;
const LOGO_GEN_COST = 4;
const LOGO_EDIT_COST = 1;
const XP_REWARD = 150;

interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => void;
}

const LogoGenerator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
  const { selectedPersona, selectedSlogan, project_name } = project.project_data;

  const [prompt, setPrompt] = useState(project.project_data.logoPrompt || '');
  const [style, setStyle] = useState('Vector');
  const [logoOptions, setLogoOptions] = useState<string[]>(project.project_data.logoOptions || []);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(project.project_data.selectedLogoUrl || null);
  const [editPrompt, setEditPrompt] = useState('');

  const [isLoading, setIsLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  if (!selectedPersona) {
    return <div className="p-6 bg-surface rounded-2xl text-center"><p>Pilih Persona di Langkah 1 dulu, Juragan!</p></div>;
  }

  const handleGeneratePrompt = async () => {
    if (!selectedPersona) return;
    if ((project.user_id && (await deductCredits(LOGO_PROMPT_COST)) === false)) return;
    setIsLoading('prompt'); setError(null);
    try {
      const slogan = selectedSlogan || `Slogan untuk ${project_name}`;
      const newPrompt = await generateLogoPrompt(slogan, selectedPersona);
      setPrompt(newPrompt);
      await onUpdateProject({ logoPrompt: newPrompt });
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  };

  const handleGenerateLogos = async () => {
    if (!prompt) { setError("Prompt logo tidak boleh kosong!"); return; }
    if ((project.user_id && (await deductCredits(LOGO_GEN_COST)) === false)) return;
    setIsLoading('logos'); setError(null); playSound('start');
    try {
      const logos = await generateLogoOptions(prompt, style);
      setLogoOptions(logos);
      await onUpdateProject({ logoOptions: logos });
      await addXp(XP_REWARD);
      playSound('success');
    } catch (err) { setError((err as Error).message); playSound('error'); } finally { setIsLoading(false); }
  };
  
  const handleSelectLogo = (url: string) => {
      setSelectedLogo(url);
      onUpdateProject({ selectedLogoUrl: url });
      playSound('select');
  };

  const handleEditLogo = async () => {
    if (!selectedLogo || !editPrompt) return;
    if ((project.user_id && (await deductCredits(LOGO_EDIT_COST)) === false)) return;
    setIsLoading('edit'); setError(null);
    try {
      const editedLogoUrl = await editLogo(selectedLogo, editPrompt);
      setSelectedLogo(editedLogoUrl); // Replace the selected logo with the edited one
      setLogoOptions(prev => prev.map(logo => logo === selectedLogo ? editedLogoUrl : logo));
      await onUpdateProject({ selectedLogoUrl: editedLogoUrl, logoOptions });
    } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4 p-4 bg-surface rounded-2xl">
          <h3 className="text-xl font-bold text-text-header">1. Atur Detail Logo</h3>
          <Textarea label="Prompt Logo" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="Jelaskan logo impianmu di sini..." />
          <Button onClick={handleGeneratePrompt} isLoading={isLoading === 'prompt'} disabled={!!isLoading} size="small" variant="secondary">
            Bantu Saya Buat Prompt ({LOGO_PROMPT_COST} T)
          </Button>
          <Select label="Gaya Logo" name="style" value={style} onChange={e => setStyle(e.target.value)} options={[{value: 'Vector', label: 'Vector'}, {value: '3D', label: '3D'}, {value: 'Cartoon', label: 'Kartun'}, {value: 'Pixel Art', label: 'Pixel Art'}, {value: 'Hand-drawn', label: 'Gambar Tangan'}]} />
          <Button onClick={handleGenerateLogos} isLoading={isLoading === 'logos'} disabled={!!isLoading || !prompt} className="w-full">
            Buat Pilihan Logo! ({LOGO_GEN_COST} Token, +{XP_REWARD} XP)
          </Button>
          {error && <ErrorMessage message={error} />}
        </div>
        
        {/* Results */}
        <div className="space-y-4 p-4 bg-surface rounded-2xl">
          <h3 className="text-xl font-bold text-text-header">2. Pilih Logo Juara</h3>
          {isLoading === 'logos' && <div className="flex justify-center p-4"><LoadingMessage/></div>}
          {logoOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-3 animate-content-fade-in">
              {logoOptions.map((url) => (
                <div key={url} onClick={() => handleSelectLogo(url)} className={`p-2 border-2 rounded-lg cursor-pointer transition-all group ${selectedLogo === url ? 'selection-card-active' : 'selection-card'}`}>
                  <img src={url} alt="logo option" className="w-full aspect-square object-contain bg-white rounded-md"/>
                </div>
              ))}
            </div>
          )}
          {selectedLogo && (
             <div className="pt-4 border-t border-border-main animate-content-fade-in">
                <h4 className="font-semibold text-text-muted mb-2">Edit Cepat Logo Terpilih</h4>
                <div className="flex gap-2">
                    <Input label="Instruksi Edit" name="editPrompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="Contoh: ganti warnanya jadi biru" />
                    <Button onClick={handleEditLogo} isLoading={isLoading === 'edit'} disabled={!!isLoading || !editPrompt} className="self-end">
                        Edit ({LOGO_EDIT_COST} T)
                    </Button>
                </div>
             </div>
          )}
        </div>
      </div>
      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} altText="Logo Preview" onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default LogoGenerator;
