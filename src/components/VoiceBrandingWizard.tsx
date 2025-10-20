// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage, Modality } from '@google/genai';
import { useUserActions } from '../contexts/UserActionsContext';
import { getAiClient } from '../services/geminiService';
import { encode } from '../utils/audioUtils';
import Button from './common/Button';
import { playSound } from '../services/soundService';

interface Props {
    show: boolean;
    onClose: () => void;
}

const SYSTEM_INSTRUCTION = `Anda adalah "Mang AI", konsultan branding AI yang ramah dan antusias dari aplikasi desain.fun. Gaya bicaramu santai seperti teman ngobrol, gunakan sapaan "Juragan". Tugasmu adalah memandu pengguna (Juragan) untuk mengisi 5 informasi penting tentang bisnis mereka: Nama Bisnis, Detail Bisnis, Industri, Target Audiens, dan Keunggulan. Ajukan pertanyaan satu per satu, tunggu jawaban pengguna, dan berikan konfirmasi singkat setelah setiap jawaban. Setelah kelima informasi terkumpul, rangkum semua jawaban dengan jelas, lalu akhiri percakapan dengan mengatakan "TRANSKRIP_SELESAI" dan tidak ada kata lain setelahnya. Mulai percakapan dengan menyapa dan menanyakan nama bisnisnya.`;

const VoiceBrandingWizard: React.FC<Props> = ({ show, onClose }) => {
    const { setLastVoiceConsultationResult } = useUserActions();
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'finished'>('idle');
    const [transcript, setTranscript] = useState<{ speaker: 'mang-ai' | 'juragan'; text: string }[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    // FIX: Corrected the type 'MediaStreamSourceNode' to the correct 'MediaStreamAudioSourceNode'.
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startConversation = async () => {
        setStatus('listening');
        setTranscript([{ speaker: 'mang-ai', text: 'Oke, Juragan! Siap ngobrolin brand-mu. Pertama-tama, nama bisnisnya apa nih?' }]);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
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
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'juragan') {
                                    last.text += text;
                                    return [...prev.slice(0, -1), last];
                                }
                                return [...prev, { speaker: 'juragan', text }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            if (text.includes('TRANSKRIP_SELESAI')) {
                                processFinalTranscript();
                                return;
                            }
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'mang-ai') {
                                    last.text += text;
                                    return [...prev.slice(0, -1), last];
                                }
                                return [...prev, { speaker: 'mang-ai', text }];
                            });
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setStatus('idle');
                    },
                    onclose: (e: CloseEvent) => {
                        // Clean up
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
            setStatus('idle');
        }
    };

    const stopConversation = () => {
        sessionPromiseRef.current?.then(session => session.close());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(() => {});
        streamRef.current?.getTracks().forEach(track => track.stop());
        setStatus('idle');
    };
    
    const processFinalTranscript = async () => {
        setStatus('processing');
        stopConversation();

        const fullTranscript = transcript.map(t => `${t.speaker === 'mang-ai' ? 'Mang AI' : 'Juragan'}: ${t.text}`).join('\n');
        
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Dari transkrip percakapan ini, ekstrak 5 informasi ke dalam format JSON: businessName, businessDetail, industry, targetAudience, valueProposition. Pastikan semua field ada, isi dengan "Tidak disebutkan" jika tidak ditemukan.\n\nTranskrip:\n${fullTranscript}`,
                config: { responseMimeType: 'application/json' }
            });

            const parsedResult = JSON.parse(response.text);
            setLastVoiceConsultationResult(parsedResult);
            setStatus('finished');
            playSound('success');
        } catch (err) {
            console.error('Failed to process transcript:', err);
        }
    };
    
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-lg w-full">
                <h3 className="text-xl font-bold text-text-header">Konsultasi Suara dengan Mang AI</h3>
                
                <div className="my-4 p-2 bg-background rounded-lg h-48 overflow-y-auto text-sm space-y-2">
                    {transcript.map((t, i) => (
                        <p key={i} className={t.speaker === 'mang-ai' ? 'text-primary' : 'text-text-body'}>
                            <strong>{t.speaker === 'mang-ai' ? 'Mang AI' : 'Juragan'}:</strong> {t.text}
                        </p>
                    ))}
                </div>

                {status === 'idle' && <Button onClick={startConversation}>Mulai Ngobrol</Button>}
                {status === 'listening' && <Button onClick={stopConversation} variant="secondary">Hentikan</Button>}
                {status === 'processing' && <p>Memproses hasil obrolan...</p>}
                {status === 'finished' && (
                    <div>
                        <p className="text-green-400">Selesai! Proyek baru akan dibuat berdasarkan obrolan kita.</p>
                        <Button onClick={onClose} className="mt-4">Tutup</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;
