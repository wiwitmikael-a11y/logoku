// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage, Modality } from '@google/genai';
import { getAiClient, generateLogoOptions, generateLogoPrompt } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import Button from './common/Button';
import { playSound } from '../services/soundService';
import Spinner from './common/Spinner';
import type { BrandInputs, ProjectData, BrandPersona } from '../types';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface Props {
    show: boolean;
    onClose: () => void;
    onProjectCreated: (projectData: ProjectData) => Promise<void>;
}

const SYSTEM_INSTRUCTION = `Anda adalah "Mang AI", konsultan branding AI yang ramah dan antusias dari aplikasi desain.fun. Gaya bicaramu santai seperti teman ngobrol, gunakan sapaan "Juragan". Tugasmu adalah memandu pengguna (Juragan) untuk mengisi 5 informasi penting tentang bisnis mereka: Nama Bisnis, Detail Bisnis, Industri, Target Audiens, dan Keunggulan. Ajukan pertanyaan satu per satu, tunggu jawaban pengguna, dan berikan konfirmasi singkat setelah setiap jawaban. Setelah kelima informasi terkumpul, rangkum semua jawaban dengan jelas, lalu akhiri percakapan dengan mengatakan "TRANSKRIP_SELESAI" dan tidak ada kata lain setelahnya. Mulai percakapan dengan menyapa dan menanyakan nama bisnisnya.`;

const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose, onProjectCreated }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing' | 'finished'>('idle');
    const [transcript, setTranscript] = useState<{ speaker: 'mang-ai' | 'juragan'; text: string }[]>([]);
    const sessionPromiseRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);
    let nextStartTime = 0;
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    const startConversation = async () => {
        setStatus('listening');
        setTranscript([]);
        
        // Safety timeout
        timeoutRef.current = window.setTimeout(() => {
            setTranscript(prev => [...prev, { speaker: 'mang-ai', text: "Sesi sudah berjalan 5 menit dan akan dihentikan untuk hemat token. Silakan mulai lagi jika belum selesai." }]);
            stopConversation();
        }, SESSION_TIMEOUT_MS);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const ai = getAiClient();
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session: any) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                const newText = last?.speaker === 'juragan' ? last.text + text : text;
                                const newTranscript = last?.speaker === 'juragan' ? prev.slice(0, -1) : prev;
                                return [...newTranscript, { speaker: 'juragan', text: newText }];
                            });
                        }
                        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            setStatus('speaking');
                            const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            if (text.includes('TRANSKRIP_SELESAI')) {
                                processFinalTranscript();
                                return;
                            }
                             setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                const newText = last?.speaker === 'mang-ai' ? last.text + text : text;
                                const newTranscript = last?.speaker === 'mang-ai' ? prev.slice(0, -1) : prev;
                                return [...newTranscript, { speaker: 'mang-ai', text: newText }];
                            });
                        }
                         if (message.serverContent?.turnComplete) {
                            setStatus('listening');
                        }
                    },
                    onerror: (e: any) => {
                        console.error('Live session error:', e);
                        setTranscript(prev => [...prev, { speaker: 'mang-ai', text: 'Waduh, koneksi ngadat. Coba lagi ya, Juragan.' }]);
                        stopConversation();
                    },
                    onclose: () => {
                        if (status !== 'processing' && status !== 'finished') {
                           stopConversation();
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: SYSTEM_INSTRUCTION,
                },
            });
        } catch (err) {
            console.error('Error starting voice wizard:', err);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setStatus('idle');
        }
    };

    const stopConversation = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        sessionPromiseRef.current?.then((session: any) => session.close());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(() => {});
        outputAudioContextRef.current?.close().catch(() => {});
        streamRef.current?.getTracks().forEach(track => track.stop());
        sessionPromiseRef.current = null;
        if (status !== 'processing' && status !== 'finished') {
            setStatus('idle');
        }
    };
    
    const processFinalTranscript = async () => {
        setStatus('processing');
        stopConversation(); // This will also clear the timeout

        const fullTranscript = transcript.map(t => `${t.speaker === 'mang-ai' ? 'Mang AI' : 'Juragan'}: ${t.text}`).join('\n');
        
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Dari transkrip percakapan ini, ekstrak 5 informasi ke dalam format JSON: businessName, businessDetail, industry, targetAudience, valueProposition. Pastikan semua field ada, isi dengan "Tidak disebutkan" jika tidak ditemukan.\n\nTranskrip:\n${fullTranscript}`,
                config: { responseMimeType: 'application/json' }
            });

            const parsedResult: BrandInputs = JSON.parse(response.text);
            const projectName = parsedResult.businessName || `Proyek Suara ${new Date().toLocaleTimeString('id-ID')}`;
            
            // Now, create the full project data
            const personaResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Buat 1 persona brand paling cocok untuk bisnis ini: ${JSON.stringify(parsedResult)}. Hasil harus berupa 1 objek JSON tunggal (bukan array) dengan properti: nama_persona, deskripsi, gaya_bicara, palet_warna (array 5 objek {hex, nama}), visual_style.`,
                 config: { responseMimeType: 'application/json' }
            });
            const selectedPersona: BrandPersona = JSON.parse(personaResponse.text);

            const logoPrompt = await generateLogoPrompt(`Slogan untuk ${projectName}`, selectedPersona);
            const logoOptions = await generateLogoOptions(logoPrompt, 'Vector');
            
            const finalProjectData: ProjectData = {
                project_name: projectName,
                brandInputs: parsedResult,
                slogans: [],
                selectedSlogan: null,
                brandPersonas: [selectedPersona],
                selectedPersona: selectedPersona,
                logoPrompt,
                logoOptions,
                selectedLogoUrl: logoOptions[0],
                logoVariations: [],
                socialMediaKit: null,
                socialProfiles: null,
                contentCalendar: null,
            };

            await onProjectCreated(finalProjectData);
            setStatus('finished');
            playSound('success');
            setTimeout(onClose, 1500);

        } catch (err) {
            console.error('Failed to process transcript:', err);
            setTranscript(prev => [...prev, { speaker: 'mang-ai', text: `Waduh, gagal memproses obrolan. ${(err as Error).message}. Silakan coba lagi atau pakai mode manual.` }]);
            setStatus('idle');
        }
    };
    
    if (!show) return null;
    
    const getAvatarAnimation = () => {
      if (status === 'speaking') return { animation: 'mang-ai-talking-bounce 0.3s ease-in-out infinite' };
      if (status === 'listening' || status === 'processing') return { animation: 'mang-ai-breathing 2.5s ease-in-out infinite' };
      return {};
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-lg w-full">
                 <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors" disabled={status === 'processing' || status === 'finished'}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4" style={getAvatarAnimation()}>
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <h3 className="text-xl font-bold text-text-header">Konsultasi Suara dengan Mang AI</h3>
                </div>
                
                <div className="my-4 p-3 bg-background rounded-lg h-48 overflow-y-auto text-sm space-y-3">
                    {transcript.map((t, i) => (
                        <div key={i} className={`flex gap-2 ${t.speaker === 'mang-ai' ? '' : 'justify-end'}`}>
                           <div className={`max-w-[80%] p-2 rounded-lg ${t.speaker === 'mang-ai' ? 'bg-primary/10 text-text-body' : 'bg-splash/20 text-text-header'}`}>
                            {t.text}
                           </div>
                        </div>
                    ))}
                     {status === 'listening' && 
                        <div className="flex justify-end">
                            <div className="p-2 bg-splash/20 rounded-lg">
                                <div className="w-1 h-1 bg-text-header rounded-full animate-bounce [animation-delay:-0.3s] mx-0.5 inline-block"></div>
                                <div className="w-1 h-1 bg-text-header rounded-full animate-bounce [animation-delay:-0.15s] mx-0.5 inline-block"></div>
                                <div className="w-1 h-1 bg-text-header rounded-full animate-bounce mx-0.5 inline-block"></div>
                            </div>
                        </div>
                     }
                     <div ref={transcriptEndRef} />
                </div>

                {status === 'idle' && <Button onClick={startConversation} className="w-full">Mulai Ngobrol</Button>}
                {status === 'listening' || status === 'speaking' ? <Button onClick={stopConversation} variant="secondary" className="w-full">Hentikan</Button> : null}
                {(status === 'processing' || status === 'finished') && (
                    <div className="text-center p-4">
                        <Spinner />
                        <p className="mt-2 text-green-400 font-semibold">
                            {status === 'processing' ? 'Mantap! Mang AI lagi meracik brand-mu...' : 'Selesai! Proyek barumu sudah jadi...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;