// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound, unlockAudio } from '../services/soundService';
import type { Project, ProjectData, AiPresenterAsset } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import Select from './common/Select';
import ErrorMessage from './common/ErrorMessage';
import CollapsibleSection from './common/CollapsibleSection';

const PRESENTER_COST = 4;
const XP_REWARD = 75;

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const AiPresenter: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp } = useUserActions();
    
    const [script, setScript] = useState('');
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [voice, setVoice] = useState('Kore');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const mouthRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const availableCharacters = project.project_data.sotoshop_assets?.mascots || [];

    const handleGenerate = async () => {
        if (!script.trim() || !selectedChar) {
            setError('Pilih karakter dan isi skrip dulu!');
            return;
        }
        if ((profile?.credits ?? 0) < PRESENTER_COST) {
            setError(`Token tidak cukup, butuh ${PRESENTER_COST} token.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAudioUrl(null);
        try {
            if (!(await deductCredits(PRESENTER_COST))) throw new Error("Gagal mengurangi token.");
            
            const generatedAudioUrl = await generateSpeech(script, voice);
            setAudioUrl(generatedAudioUrl);
            await handleSaveToProject(selectedChar, script, generatedAudioUrl);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat presentasi.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveToProject = async (characterUrl: string, script: string, audioUrl: string) => {
        const newAsset: AiPresenterAsset = { id: `pre_${Date.now()}`, characterUrl, script, audioUrl };
        const currentAssets = project.project_data.sotoshop_assets?.aiPresenter || [];
        await onUpdateProject({
            sotoshop_assets: { ...project.project_data.sotoshop_assets, aiPresenter: [...currentAssets, newAsset] }
        });
    };
    
    useEffect(() => {
        if (!audioUrl || !audioRef.current || !mouthRef.current) return;
        
        const audio = audioRef.current;
        let audioContext: AudioContext;
        let source: MediaElementAudioSourceNode;

        const setupAudioContext = async () => {
            await unlockAudio();
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            analyserRef.current = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContext.destination);
            analyserRef.current.fftSize = 32;
        };

        const animateMouth = () => {
             if (!analyserRef.current || !containerRef.current) {
                if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = requestAnimationFrame(animateMouth);
                return;
            }
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            const bounceIntensity = Math.min(avg / 100, 1.0);
            if (containerRef.current) {
                containerRef.current.style.animation = audio.paused ? 'none' : `mang-ai-talking-bounce ${0.2 + (1-bounceIntensity)*0.3}s ease-in-out infinite`;
            }

            animationFrameRef.current = requestAnimationFrame(animateMouth);
        };
        
        audio.onplay = () => {
             if (!analyserRef.current) setupAudioContext().then(animateMouth);
             else animateMouth();
        };

        audio.onpause = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (containerRef.current) containerRef.current.style.animation = 'none';
        };

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if(source) source.disconnect();
            if(analyserRef.current) analyserRef.current.disconnect();
        };

    }, [audioUrl]);

    return (
        <CollapsibleSection title="AI Presenter" icon="🎙️">
            <div className="space-y-4">
                <p className="text-sm text-text-body">Punya maskot? Sekarang dia bisa ngomong! Pilih karakter, tulis skripnya, dan biarkan Mang AI yang jadi pengisi suaranya. Cocok buat konten video pendek!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                        <h4 className="font-semibold text-text-muted">1. Pilih Karakter</h4>
                        {availableCharacters.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-background/50 p-2 rounded-lg">
                               {availableCharacters.map((url, i) => (
                                   <img key={i} src={url} alt={`Karakter ${i}`} onClick={() => setSelectedChar(url)} className={`w-full aspect-square object-contain rounded-md cursor-pointer border-2 ${selectedChar === url ? 'border-primary' : 'border-transparent'}`}/>
                               ))}
                            </div>
                        ) : (
                            <p className="text-xs text-text-muted p-4 bg-background/50 rounded-lg">Buat maskot dulu di Sotoshop untuk memilih karakter.</p>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <div>
                             <h4 className="font-semibold text-text-muted mb-2">2. Atur Suara & Skrip</h4>
                             <Select 
                                label="Suara & Nada Bicara"
                                name="voice"
                                value={voice}
                                onChange={(e) => setVoice(e.target.value)}
                                options={[
                                    { value: 'Kore', label: 'Wanita - Ceria & Ramah' },
                                    { value: 'Puck', label: 'Pria - Santai & Muda' },
                                    { value: 'Charon', label: 'Pria - Dewasa & Berwibawa' },
                                    { value: 'Zephyr', label: 'Wanita - Elegan & Profesional' },
                                    { value: 'Fenrir', label: 'Pria - Enerjik & Antusias' },
                                ]}
                            />
                        </div>
                        <Textarea label="" name="script" value={script} onChange={e => setScript(e.target.value)} placeholder="Ketik apa yang mau diucapkan karakter di sini..." rows={5} />
                    </div>
                </div>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!script.trim() || !selectedChar || isLoading} variant="accent" className="w-full">
                    Buat Presentasi! ({PRESENTER_COST} Token)
                </Button>

                {error && <ErrorMessage message={error} />}

                {(isLoading || audioUrl) && (
                    <div className="p-4 bg-background/50 rounded-lg border border-border-main text-center">
                        <h4 className="font-bold text-text-header mb-4">Hasil Presentasi</h4>
                         <p className="text-xs text-green-400 mb-2">✓ Otomatis tersimpan di Lemari Brand.</p>
                        {isLoading && <p>Membuat audio...</p>}
                        {audioUrl && selectedChar && (
                            <div className="flex flex-col items-center gap-4">
                                <div ref={containerRef} className="relative w-40 h-40">
                                    <img src={selectedChar} alt="Karakter Presenter" className="w-full h-full object-contain"/>
                                </div>
                                <audio ref={audioRef} src={audioUrl} controls className="w-full max-w-sm"/>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default AiPresenter;
