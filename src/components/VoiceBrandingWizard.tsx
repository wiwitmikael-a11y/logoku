// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { getAiClient } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { BrandInputs } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import VoiceVisualizer from './common/VoiceVisualizer';
import { playSound, unlockAudio } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const CONSULTATION_STEPS: (keyof BrandInputs)[] = [
  'businessName', 'industry', 'targetAudience', 'valueProposition'
];

const PROMPTS: Record<keyof BrandInputs, string> = {
  businessName: "Siap, Juragan! Kita mulai ya. Pertama, apa nama bisnis atau brand-nya?",
  industry: "Oke, dicatat! Selanjutnya, bisnis ini bergerak di bidang industri apa ya?",
  targetAudience: "Sip. Sekarang, siapa target utama pelanggan atau audiensnya?",
  valueProposition: "Hampir selesai! Terakhir, apa sih keunggulan utama atau nilai jual unik dari produk/jasa Juragan?",
  competitorAnalysis: "", // Not used in voice wizard
  businessDetail: "", // Not used in voice wizard
};

type ConversationState = 'IDLE' | 'REQUESTING_MIC' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'COMPLETED' | 'ERROR';

const VoiceBrandingWizard: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    const [currentState, setCurrentState] = useState<ConversationState>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs>>({});
    const currentTranscriptionRef = useRef('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const { setLastVoiceConsultationResult } = useUserActions();

    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    
    const handleStartConsultation = async () => {
        await unlockAudio();
        playSound('start');
        setCurrentState('REQUESTING_MIC');
        setError(null);
        setBrandInputs({});
        setCurrentStepIndex(0);
        
        try {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const ai = getAiClient();
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                        setCurrentState('LISTENING');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setCurrentState('SPEAKING');
                            const audioContext = outputAudioContextRef.current;
                            if (audioContext) {
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                                const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
                                const source = audioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(audioContext.destination);
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                            }
                        }

                        const transcription = message.serverContent?.inputTranscription?.text;
                        if (transcription) {
                           currentTranscriptionRef.current += transcription;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullTranscription = currentTranscriptionRef.current.trim();
                            currentTranscriptionRef.current = '';
                            if (fullTranscription && currentStepIndex < CONSULTATION_STEPS.length) {
                                const currentField = CONSULTATION_STEPS[currentStepIndex];
                                setBrandInputs(prev => ({...prev, [currentField]: fullTranscription}));
                                const nextStep = currentStepIndex + 1;
                                if (nextStep < CONSULTATION_STEPS.length) {
                                    setCurrentStepIndex(nextStep);
                                } else {
                                    setCurrentState('COMPLETED');
                                }
                            }
                           setCurrentState('LISTENING');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(`Terjadi kesalahan koneksi: ${e.message}`);
                        setCurrentState('ERROR');
                    },
                    onclose: () => {
                         // Stop mic stream
                        stream.getTracks().forEach(track => track.stop());
                        inputAudioContext.close();
                        if (currentState !== 'COMPLETED') {
                            setCurrentState('IDLE');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    inputAudioTranscription: {},
                    systemInstruction: `Anda adalah Mang AI, asisten branding yang ramah dan efisien untuk UMKM. Panggil pengguna dengan sebutan "Juragan". Tugas Anda adalah menanyakan serangkaian pertanyaan untuk mengisi data brand. Berbicara dengan singkat, jelas, dan bersemangat. Setelah setiap jawaban, berikan respon singkat seperti "Oke!", "Sip!", atau "Dicatat!", lalu lanjutkan ke pertanyaan berikutnya. Setelah pertanyaan terakhir, katakan "Mantap, semua data sudah lengkap! Saya simpan hasilnya ya, Juragan."`,
                },
            });
            // Send initial prompt
            const session = await sessionPromiseRef.current;
            session.sendText({ text: PROMPTS[CONSULTATION_STEPS[0]] });

        } catch (err) {
            setError(err instanceof Error ? `Gagal memulai: ${err.message}` : 'Gagal memulai sesi.');
            setCurrentState('ERROR');
        }
    };
    
    const handleClose = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if(outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        if (currentState === 'COMPLETED') {
            setLastVoiceConsultationResult(brandInputs as BrandInputs);
            playSound('success');
        }
        
        onClose();
        setTimeout(() => { // Reset state after transition out
            setCurrentState('IDLE');
            setBrandInputs({});
            setCurrentStepIndex(0);
        }, 300);
    }, [currentState, brandInputs, onClose, setLastVoiceConsultationResult]);

    useEffect(() => {
        if (currentState === 'COMPLETED' && sessionPromiseRef.current) {
             sessionPromiseRef.current.then(session => {
                session.sendText({ text: "Mantap, semua data sudah lengkap! Saya simpan hasilnya ya, Juragan." });
             });
             setTimeout(handleClose, 4000); // Auto close after final message
        }
    }, [currentState, handleClose]);

    if (!show) return null;

    const ConsultationChecklist = () => (
        <div className="space-y-2 mt-4">
            {CONSULTATION_STEPS.map((stepKey, index) => (
                <div key={stepKey as string} className={`flex items-start transition-all duration-300 ${index > currentStepIndex ? 'opacity-40' : 'opacity-100'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 ${brandInputs[stepKey] ? 'bg-green-500' : 'bg-border-main'}`}>
                       {brandInputs[stepKey] && <span className="text-white">✓</span>}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-text-header capitalize">{(stepKey as string).replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-text-body">{brandInputs[stepKey] || '...'}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        switch (currentState) {
            case 'IDLE':
                return (
                    <>
                        <p className="text-text-body mt-2 mb-6 text-center">Mang AI akan memandumu mengisi data brand lewat sesi tanya jawab singkat. Siapkan suaramu!</p>
                        <button onClick={handleStartConsultation} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors">Mulai Konsultasi Suara</button>
                    </>
                );
            case 'REQUESTING_MIC':
                return <p className="text-center text-text-muted">Meminta izin mikrofon...</p>;
            case 'LISTENING':
            case 'THINKING':
            case 'SPEAKING':
                 return (
                    <>
                        <p className="text-center text-text-header font-semibold mb-3">{PROMPTS[CONSULTATION_STEPS[currentStepIndex]]}</p>
                        <div className="relative h-20 flex items-center justify-center">
                            {currentState === 'LISTENING' && (
                                <div className='text-center'>
                                    <VoiceVisualizer />
                                    <p className="text-sm text-accent animate-pulse mt-2">Mang AI sedang mendengarkan...</p>
                                </div>
                            )}
                            {currentState === 'SPEAKING' && <p className="text-center text-accent animate-pulse">Mang AI sedang berbicara...</p>}
                        </div>
                        <ConsultationChecklist />
                    </>
                 );
            case 'COMPLETED':
                return (
                    <>
                         <p className="text-center text-green-400 font-semibold mb-3">Konsultasi Selesai!</p>
                         <p className="text-center text-text-muted">Mantap! Data akan otomatis diisi ke form.</p>
                         <ConsultationChecklist />
                    </>
                );
            case 'ERROR':
                 return (
                    <>
                        <p className="text-center text-red-500 font-semibold mb-3">Waduh, ada masalah!</p>
                        <p className="text-sm text-center text-text-muted break-words">{error}</p>
                        <button onClick={handleStartConsultation} className="w-full mt-4 py-2 bg-primary text-white rounded-lg">Coba Lagi</button>
                    </>
                )
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in" style={{animationDuration: '0.3s'}}>
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full">
                <button onClick={handleClose} title="Tutup" className="absolute top-4 right-4 z-10 p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-20 h-20 mx-auto mb-4" style={{imageRendering: 'pixelated'}}/>
                    <h2 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Konsultasi Suara Brand</h2>
                </div>
                <div className="mt-4 min-h-[200px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;