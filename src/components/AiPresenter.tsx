// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { generateCharacterImage, generateSpeech } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import type { Project, AiPresenterAsset } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ErrorMessage from './common/ErrorMessage';
import CollapsibleSection from './common/CollapsibleSection';
import { uploadBase64Audio } from '../services/storageService';
import Spinner from './common/Spinner';

const CHARACTER_COST = 2;
const SPEECH_COST = 6; // Disesuaikan untuk subsidi
const XP_REWARD = 50;

interface Props {
    project: Project;
    onUpdateProject: (data: any) => Promise<void>;
}

const AiPresenter: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    
    const [characterPrompt, setCharacterPrompt] = useState('');
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState<string | false>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Partial<AiPresenterAsset>>({});

    useEffect(() => {
        setCharacterPrompt('');
        setScript('');
        setResult({});
        setError(null);
    }, [project]);

    const handleGenerateCharacter = async () => {
        if (!characterPrompt.trim()) { setError('Deskripsi karakter tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < CHARACTER_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading('character');
        setError(null);
        try {
            if (!(await deductCredits(CHARACTER_COST))) throw new Error("Gagal mengurangi token.");
            const imageUrl = await generateCharacterImage(characterPrompt);
            setResult(prev => ({ ...prev, characterUrl: imageUrl }));
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat karakter.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSpeech = async () => {
        if (!script.trim()) { setError('Naskah tidak boleh kosong!'); return; }
        if ((profile?.credits ?? 0) < SPEECH_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading('speech');
        setError(null);
        try {
            if (!(await deductCredits(SPEECH_COST))) throw new Error("Gagal mengurangi token.");
            if (!user) throw new Error("User tidak ditemukan");
            
            const audioBase64 = await generateSpeech(script);
            // Upload to get a permanent URL
            const audioUrl = await uploadBase64Audio(audioBase64, user.id, 'audio/mpeg');
            setResult(prev => ({ ...prev, script, audioUrl }));
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat audio.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async () => {
        if (!result.characterUrl || !result.audioUrl || !result.script) {
            setError("Karakter dan audio harus dibuat dulu sebelum menyimpan.");
            return;
        }
        setIsLoading('save');
        const finalAsset: AiPresenterAsset = {
            id: `presenter_${Date.now()}`,
            characterUrl: result.characterUrl,
            script: result.script,
            audioUrl: result.audioUrl
        };

        const currentPresenters = project.project_data.sotoshop_assets?.aiPresenter || [];
        const newPresenters = [...currentPresenters, finalAsset];
        try {
           await onUpdateProject({ sotoshop_assets: { ...project.project_data.sotoshop_assets, aiPresenter: newPresenters } });
           await addXp(XP_REWARD);
           // Reset for next creation
           setResult({});
           setCharacterPrompt('');
           setScript('');
           playSound('success');
        } catch (err) {
            setError(`Gagal menyimpan: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CollapsibleSection title="Presenter AI" icon="🤖" initialOpen={false}>
            <div className="space-y-4">
                <p className="text-sm text-text-body">Buat karakter virtual untuk presentasi atau konten video. Tentukan penampilan karakter, tulis naskahnya, dan Mang AI akan membuatkan suaranya.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Character Generation */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-text-header">1. Buat Karakter</h4>
                        <Textarea label="Deskripsi penampilan karakter" name="characterPrompt" value={characterPrompt} onChange={e => setCharacterPrompt(e.target.value)} placeholder="Contoh: seorang wanita muda berhijab dengan kacamata, tersenyum ramah" rows={3} />
                        <Button onClick={handleGenerateCharacter} isLoading={isLoading === 'character'} disabled={!!isLoading || !characterPrompt.trim()}>
                            Buat Karakter ({CHARACTER_COST} T)
                        </Button>
                        {result.characterUrl && (
                             <div className="p-2 bg-background rounded-lg text-center">
                                <img src={result.characterUrl} alt="Generated character" className="w-32 h-32 mx-auto rounded-md object-cover"/>
                                <p className="text-xs text-green-500 mt-1">Karakter siap!</p>
                             </div>
                        )}
                    </div>

                    {/* Speech Generation */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-text-header">2. Buat Audio</h4>
                        <Textarea label="Tulis naskah / skrip" name="script" value={script} onChange={e => setScript(e.target.value)} placeholder="Contoh: Halo Juragan! Selamat datang di toko kami..." rows={3} />
                        <Button onClick={handleGenerateSpeech} isLoading={isLoading === 'speech'} disabled={!!isLoading || !script.trim()}>
                            Buat Suara ({SPEECH_COST} T)
                        </Button>
                         {result.audioUrl && (
                             <div className="p-2 bg-background rounded-lg text-center">
                                <audio src={result.audioUrl} controls className="w-full h-10" />
                                <p className="text-xs text-green-500 mt-1">Audio siap!</p>
                             </div>
                        )}
                    </div>
                </div>
                
                {error && <ErrorMessage message={error} />}

                <div className="pt-4 border-t border-border-main text-center">
                    <Button onClick={handleSaveToProject} isLoading={isLoading === 'save'} disabled={!result.characterUrl || !result.audioUrl || !!isLoading} variant="accent">
                        Simpan Presenter ke Lemari Brand (+{XP_REWARD} XP)
                    </Button>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default AiPresenter;