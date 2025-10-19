// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed non-existent 'LiveSession' type from import. The session object type will be inferred.
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { useUserActions } from '../contexts/UserActionsContext';
import { getAiClient } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { playSound, unlockAudio } from '../services/soundService';
import type { BrandInputs } from '../types';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const systemInstruction = `You are "Mang AI", a friendly and expert branding consultant for small businesses in Indonesia. Your goal is to conduct a voice consultation to gather all the necessary information to build a brand persona. You MUST ask questions one by one to fill out these fields: businessName, businessDetail, industry, targetAudience, valueProposition, and competitorAnalysis. Speak in a friendly, informal Indonesian style ("lo-gue" is okay). Be encouraging. Once you have gathered all the information, you MUST call the 'submitBrandingInputs' function with the collected data. Do not end the conversation until you have called the function. Start by introducing yourself and asking for the business name.`;

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

interface Props {
  show: boolean;
  onClose: () => void;
}

const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose }) => {
    const { setLastVoiceConsultationResult } = useUserActions();
    const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'DONE' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [mangAiTranscript, setMangAiTranscript] = useState('');
    
    // FIX: Changed type from Promise<LiveSession> to Promise<any> as LiveSession is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    // Refs for gapless audio playback and interruption handling
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const startConsultation = async () => {
        await unlockAudio();
        setStatus('LISTENING');
        setError(null);
        setMangAiTranscript('Mang AI sedang mendengarkan...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = getAiClient();
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
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
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                             if(status !== 'SPEAKING') setStatus('SPEAKING');
                             setMangAiTranscript(prev => prev.replace('Mang AI sedang mendengarkan...', '') + message.serverContent!.outputTranscription!.text);
                        }
                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                            const outputAudioContext = outputAudioContextRef.current!;
                            
                            // FIX: Implemented proper audio queuing for gapless playback, as per Gemini API guidelines.
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        // FIX: Added interruption handling to stop audio playback when the user interrupts.
                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                                sourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                        if(message.serverContent?.turnComplete) {
                            setUserTranscript('');
                            setMangAiTranscript('');
                            setStatus('LISTENING');
                        }
                        if (message.toolCall?.functionCalls) {
                            const fc = message.toolCall.functionCalls[0];
                            if (fc.name === 'submitBrandingInputs') {
                                // FIX: Use 'as unknown as BrandInputs' to fix the type conversion error.
                                setLastVoiceConsultationResult(fc.args as unknown as BrandInputs);
                                setStatus('DONE');
                                setMangAiTranscript('Sip, data sudah lengkap! Mang AI akan siapkan proyeknya sekarang.');
                                playSound('success');
                                stopConsultation();
                                setTimeout(onClose, 2000);
                            }
                        }
                    },
                    onclose: () => { console.log('closed'); },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setError('Terjadi kesalahan koneksi.');
                        setStatus('ERROR');
                    },
                },
            });

        } catch (err) {
            console.error(err);
            setError('Gagal mengakses mikrofon. Pastikan sudah diizinkan di browser.');
            setStatus('ERROR');
        }
    };
    
    const stopConsultation = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        sessionPromiseRef.current?.then(session => session.close());

        // FIX: Added cleanup for any queued/playing audio on session stop.
        for (const source of sourcesRef.current.values()) {
            source.stop();
        }
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setStatus('IDLE');
    };
    
    useEffect(() => {
        if (!show) {
            stopConsultation();
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
                 <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mb-4" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-2xl font-bold text-text-header mb-2">Konsultasi Suara dengan Mang AI</h2>
                <p className="text-sm text-text-body mb-6">Jawab pertanyaan Mang AI, dan biarkan dia yang mengisi formulir untukmu. Santai saja!</p>
                
                <div className="w-full min-h-[80px] bg-background p-3 rounded-lg text-left text-sm mb-4">
                    <p className="text-text-header font-semibold">Mang AI:</p>
                    <p className="text-text-body italic">{mangAiTranscript || (status === 'IDLE' && "Klik 'Mulai' untuk ngobrol.")}</p>
                    <p className="text-text-muted mt-2 text-right">{userTranscript}</p>
                </div>
                
                {error && <ErrorMessage message={error} />}

                {status === 'IDLE' || status === 'ERROR' ? (
                     <Button onClick={startConsultation} variant="primary">Mulai Konsultasi</Button>
                ) : status !== 'DONE' ? (
                    <Button onClick={stopConsultation} variant="secondary">Hentikan Sesi</Button>
                ) : null}
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;