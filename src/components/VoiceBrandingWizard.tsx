// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { useUserActions } from '../contexts/UserActionsContext';
import { getAiClient, generateBrandPersonas, generateSlogans, generateLogoPrompt, generateLogoOptions } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { playSound, unlockAudio } from '../services/soundService';
import type { BrandInputs, ProjectData, BrandPersona, Project } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import VoiceVisualizer from './common/VoiceVisualizer';
// FIX: Added missing import for getSupabaseClient to resolve database connection error.
import { getSupabaseClient } from '../services/supabaseClient';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const systemInstruction = `You are "Mang AI", a friendly and expert branding consultant for small businesses in Indonesia. Your goal is to conduct a voice consultation to gather all the necessary information to build a brand persona within a 5-minute time limit. You MUST ask questions one by one to fill out these fields: businessName, businessDetail, industry, targetAudience, valueProposition, and competitorAnalysis. Speak in a friendly, informal Indonesian style ("lo-gue" is okay). Be encouraging. Once you have gathered all the information, you MUST call the 'submitBrandingInputs' function with the collected data. Do not end the conversation until you have called the function. Start by introducing yourself and mentioning the 5-minute time limit, then ask for the business name.`;

const submitFunctionDeclaration: FunctionDeclaration = {
  name: 'submitBrandingInputs',
  parameters: {
    type: Type.OBJECT,
    description: 'Submits the collected branding information once all fields are gathered.',
    properties: {
      businessName: { type: Type.STRING, description: 'Nama bisnis atau brand.' },
      businessDetail: { type: Type.STRING, description: 'Penjelasan detail tentang bisnis.' },
      industry: { type: Type.STRING, description: 'Industri bisnis, misal: F&B, Fashion.' },
      targetAudience: { type: Type.STRING, description: 'Target pasar atau audiens.' },
      valueProposition: { type: Type.STRING, description: 'Keunggulan unik atau nilai jual produk/jasa.' },
      competitorAnalysis: { type: Type.STRING, description: 'Analisis singkat tentang kompetitor utama.' },
    },
    required: ['businessName', 'businessDetail', 'industry', 'targetAudience', 'valueProposition'],
  },
};

type Status = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'GENERATING' | 'DONE' | 'ERROR';

const VOICE_WIZARD_COST = 3;

interface Props {
  show: boolean;
  onClose: () => void;
  onCreateProject: (projectName: string, initialData: BrandInputs | null) => Promise<void>;
}

const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose, onCreateProject }) => {
    const { deductCredits } = useUserActions();
    const [status, setStatus] = useState<Status>('IDLE');
    const [generationMessage, setGenerationMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [mangAiTranscript, setMangAiTranscript] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const analyserRef = useRef<AnalyserNode | null>(null);
    const timerRef = useRef<number | null>(null);

    const startTimer = () => {
        setTimeLeft(300);
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopConsultation(true); // Auto-stop when timer ends
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    
    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startConsultation = async () => {
        await unlockAudio();
        
        if (!(await deductCredits(VOICE_WIZARD_COST))) {
            setError(`Token tidak cukup. Fitur ini butuh ${VOICE_WIZARD_COST} Token.`);
            return;
        }

        setStatus('LISTENING');
        setError(null);
        setMangAiTranscript('Mang AI sedang mendengarkan...');
        startTimer();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = getAiClient();
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputGainNode = outputAudioContextRef.current.createGain();
            outputGainNode.connect(outputAudioContextRef.current.destination);
            
            analyserRef.current = outputAudioContextRef.current.createAnalyser();
            outputGainNode.connect(analyserRef.current);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction,
                    tools: [{ functionDeclarations: [submitFunctionDeclaration] }],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Transcript handling
                        if (message.serverContent?.inputTranscription) { setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text); }
                        if (message.serverContent?.outputTranscription) {
                             if(status !== 'SPEAKING') setStatus('SPEAKING');
                             setMangAiTranscript(prev => prev.replace('Mang AI sedang mendengarkan...', '') + message.serverContent!.outputTranscription!.text);
                        }
                        // Audio playback
                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const outputAudioContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainNode);
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        // Interruption
                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) { source.stop(); sourcesRef.current.delete(source); }
                            nextStartTimeRef.current = 0;
                        }
                        if(message.serverContent?.turnComplete) {
                            setUserTranscript('');
                            setMangAiTranscript('');
                            setStatus('LISTENING');
                        }
                        // Function call -> The grand finale
                        if (message.toolCall?.functionCalls) {
                            const fc = message.toolCall.functionCalls[0];
                            if (fc.name === 'submitBrandingInputs') {
                                setStatus('GENERATING');
                                stopConsultation(false); // Soft stop, don't close modal yet
                                handleAutoBranding(fc.args as unknown as BrandInputs);
                            }
                        }
                    },
                    onclose: () => { console.log('closed'); },
                    onerror: (e) => { console.error('Live session error:', e); setError('Terjadi kesalahan koneksi.'); setStatus('ERROR'); },
                },
            });

        } catch (err) {
            console.error(err);
            setError('Gagal mengakses mikrofon. Pastikan sudah diizinkan di browser.');
            setStatus('ERROR');
        }
    };
    
    const handleAutoBranding = async (inputs: BrandInputs) => {
        try {
            setGenerationMessage("Sip, data lengkap! Mang AI mulai meracik persona brand...");
            const personas = await generateBrandPersonas(inputs);
            const selectedPersona = personas[0];

            setGenerationMessage("Persona dapet! Sekarang, cari slogan yang ciamik...");
            const slogans = await generateSlogans(inputs);
            const selectedSlogan = slogans[0];

            setGenerationMessage("Slogan mantap! Lanjut bikin resep rahasia buat logo...");
            const logoPrompt = await generateLogoPrompt(selectedSlogan, selectedPersona);

            setGenerationMessage("Resep siap! Mang AI mulai gambar logo, tunggu sebentar...");
            const logoOptions = await generateLogoOptions(logoPrompt);
            
            const finalProjectData: ProjectData = {
                project_name: inputs.businessName,
                brandInputs: inputs,
                brandPersonas: personas,
                selectedPersona: selectedPersona,
                slogans: slogans,
                selectedSlogan: selectedSlogan,
                logoPrompt: logoPrompt,
                logoOptions: logoOptions,
                selectedLogoUrl: logoOptions[0],
                logoVariations: [],
                socialMediaKit: null,
                socialProfiles: null,
                contentCalendar: null,
            };

            // This is a custom RPC call or direct insert
             const supabase = getSupabaseClient();
             const userId = (await supabase.auth.getSession()).data.session?.user.id;
             if (!userId) throw new Error("User not logged in");
             
             await supabase.from('projects').insert({ user_id: userId, project_data: finalProjectData });

            setGenerationMessage("Proyek barumu sudah siap! Mengalihkan...");
            setStatus('DONE');
            playSound('success');
            setTimeout(() => {
                onClose();
                window.location.reload(); // Easiest way to refresh projects list
            }, 2500);

        } catch (e) {
            setError(`Proses otomatis gagal: ${(e as Error).message}`);
            setStatus('ERROR');
        }
    };

    const stopConsultation = (isTimerEnd = false) => {
        stopTimer();
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        // Don't close contexts if we are in generation phase
        if (status !== 'GENERATING') {
            inputAudioContextRef.current?.close();
            outputAudioContextRef.current?.close();
        }
        sessionPromiseRef.current?.then(session => session.close());
        for (const source of sourcesRef.current.values()) { source.stop(); }
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        if(isTimerEnd) {
             setError("Waktu habis! Sesi dihentikan.");
             setStatus('ERROR');
        } else if (status !== 'GENERATING') {
             setStatus('IDLE');
        }
    };
    
    useEffect(() => {
        if (!show) {
            stopConsultation();
            stopTimer();
        }
    }, [show]);

    if (!show) return null;
    
    const isSessionActive = status === 'LISTENING' || status === 'SPEAKING' || status === 'PROCESSING';

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 animate-content-fade-in">
             <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={isSessionActive || status === 'GENERATING'}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="absolute top-4 left-4 bg-surface text-primary font-bold p-2 px-4 rounded-lg text-lg">
                <span>⏳ {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
            </div>
            
            <div className="relative w-48 h-48 mb-6">
                 <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className={`w-full h-full transition-transform duration-500 ${isSessionActive ? 'animate-breathing-ai' : ''}`} style={{ imageRendering: 'pixelated' }} />
                 {status === 'LISTENING' && <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>}
            </div>

            <h2 className="text-3xl font-bold text-text-header mb-2" style={{ fontFamily: 'var(--font-display)'}}>
                {status === 'GENERATING' ? "Mesin Branding Bekerja!" : "Konsultasi Suara Ekspres"}
            </h2>
            
            <div className="w-full max-w-2xl min-h-[120px] bg-surface/50 p-4 rounded-lg text-center text-lg mb-6 relative">
                 {status === 'GENERATING' ? (
                     <p className="text-accent italic animate-pulse">{generationMessage}</p>
                 ) : (
                    <>
                        <p className="text-text-header font-semibold">{mangAiTranscript || (status === 'IDLE' && "Klik 'Mulai' untuk ngobrol.")}</p>
                        <p className="text-text-muted mt-2 text-right text-base">{userTranscript}</p>
                    </>
                 )}
                 <div className="absolute bottom-[-40px] left-0 right-0 h-20">
                    <VoiceVisualizer analyserNode={analyserRef.current} isSpeaking={status === 'SPEAKING'}/>
                 </div>
            </div>
            
            {error && <ErrorMessage message={error} />}

            <div className="mt-8">
            {status === 'IDLE' || status === 'ERROR' ? (
                 <Button onClick={startConsultation} variant="primary" size="large">Mulai Konsultasi ({VOICE_WIZARD_COST} Token)</Button>
            ) : status !== 'DONE' && status !== 'GENERATING' ? (
                <Button onClick={() => stopConsultation()} variant="secondary" size="large">Hentikan Sesi</Button>
            ) : null}
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;
