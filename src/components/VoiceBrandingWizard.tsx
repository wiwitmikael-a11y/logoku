// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { getAiClient } from '../services/geminiService';
import { useUserActions } from '../contexts/UserActionsContext';
import { BrandInputs } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { playSound, unlockAudio } from '../services/soundService';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const CONSULTATION_STEPS: (keyof BrandInputs)[] = [
  'businessName', 'industry', 'targetAudience', 'valueProposition'
];

type ConversationState = 'IDLE' | 'REQUESTING_MIC' | 'LISTENING' | 'ANALYZING' | 'SPEAKING' | 'COMPLETED' | 'ERROR';

const VoiceBrandingWizard: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    const [currentState, setCurrentState] = useState<ConversationState>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1); // Start at -1 for introduction
    const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs>>({});
    const [liveTranscription, setLiveTranscription] = useState('');
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const { setLastVoiceConsultationResult } = useUserActions();
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleStartConsultation = async () => {
        await unlockAudio();
        playSound('start');
        setCurrentState('REQUESTING_MIC');
        setError(null);
        setBrandInputs({});
        setCurrentStepIndex(-1);
        setLiveTranscription('');
        
        try {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
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
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (currentState === 'COMPLETED') return;

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setCurrentState('SPEAKING');
                            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                            const audioContext = outputAudioContextRef.current;
                            if (audioContext) {
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                                const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
                                const sourceNode = audioContext.createBufferSource();
                                sourceNode.buffer = audioBuffer;
                                sourceNode.connect(audioContext.destination);
                                sourceNode.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourceNode.onended = () => {
                                    if(currentStepIndex < CONSULTATION_STEPS.length) {
                                       setCurrentState('LISTENING');
                                    }
                                };
                            }
                        }

                        const transcription = message.serverContent?.inputTranscription?.text;
                        if (transcription) {
                           setLiveTranscription(prev => prev + transcription);
                           if(silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullTranscription = liveTranscription.trim();
                            setLiveTranscription('');
                            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                            if (currentStepIndex >= 0) {
                                if (!fullTranscription) { 
                                    sessionPromiseRef.current?.then(session => session.sendText({ text: "Maaf, saya tidak mendengar jawaban Juragan. Bisa diulangi?" }));
                                    return;
                                }
                                const currentField = CONSULTATION_STEPS[currentStepIndex];
                                setBrandInputs(prev => ({...prev, [currentField]: fullTranscription}));
                                setCurrentState('ANALYZING');
                                
                                setTimeout(() => {
                                    const nextStepIndex = currentStepIndex + 1;
                                    sessionPromiseRef.current?.then(session => {
                                        session.sendText({ text: `Jawaban pengguna adalah: "${fullTranscription}". Lanjutkan ke langkah berikutnya.` });
                                    });
                                    setCurrentStepIndex(nextStepIndex);
                                }, 1500); // Simulate analysis time

                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(`Terjadi kesalahan koneksi: ${e.message}`);
                        setCurrentState('ERROR');
                    },
                    onclose: () => {
                        stream.getTracks().forEach(track => track.stop());
                        inputAudioContext.close();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    inputAudioTranscription: {},
                    systemInstruction: `Anda adalah Mang AI, seorang konsultan branding profesional yang ramah, efisien, dan sangat sistematis untuk UMKM. Panggil pengguna dengan sebutan "Juragan". Alur kerja Anda SANGAT TEGAS dan harus diikuti tanpa kecuali:

1.  **Pembukaan:** Saat menerima perintah "Mulai sesi konsultasi", awali dengan sapaan hangat dan profesional. Jelaskan bahwa Anda akan melakukan sesi konsultasi singkat untuk menggali 4 pilar DNA brand, lalu langsung ajukan pertanyaan pertama tentang "Nama Bisnis".

2.  **Proses Tanya Jawab:** Anda akan menerima perintah dari sistem yang berisi jawaban pengguna dan instruksi untuk "Lanjutkan ke langkah berikutnya". Berdasarkan jumlah langkah yang telah dilalui, ajukan pertanyaan sesuai urutan ini:
    *   Langkah 1: Nama Bisnis
    *   Langkah 2: Industri / Bidang Usaha
    *   Langkah 3: Target Audiens
    *   Langkah 4: Keunggulan Utama
    
3.  **Konfirmasi & Transisi WAJIB:** Respons Anda SETELAH menerima jawaban pengguna HARUS dimulai dengan konfirmasi verbal atas jawaban tersebut. Contoh: jika diberi tahu jawaban adalah "Kopi Senja", respons Anda HARUS diawali dengan, "Oke, dicatat, nama bisnisnya 'Kopi Senja' ya! Nah, selanjutnya,...". Setelah konfirmasi, baru ajukan pertanyaan berikutnya dengan transisi yang mulus.

4.  **Penutupan:** Setelah langkah ke-4 (Keunggulan Utama) terjawab dan Anda menerima perintah 'lanjutkan' untuk terakhir kalinya, JANGAN bertanya lagi. Sebaliknya, berikan rangkuman verbal singkat dari 4 poin yang telah terkumpul. Akhiri dengan ucapan selamat dan antusias, lalu katakan "Mantap, semua data sudah lengkap! Saya simpan hasilnya ya, Juragan."

5.  **Aturan Tambahan:** Selalu tunggu perintah dari sistem. Jika pengguna diam, sistem akan memberitahu Anda. Anda bisa merespons dengan, "Halo, Juragan? Apa masih di sana?".`,
                },
            });
            
            const session = await sessionPromiseRef.current;
            session.sendText({ text: "Mulai sesi konsultasi." });
            setCurrentState('SPEAKING'); // AI will start with introduction
            setCurrentStepIndex(0);

        } catch (err) {
            setError(err instanceof Error ? `Gagal memulai: ${err.message}. Pastikan izin mikrofon diberikan.` : 'Gagal memulai sesi.');
            setCurrentState('ERROR');
        }
    };
    
    useEffect(() => {
        if (currentStepIndex >= CONSULTATION_STEPS.length && currentState !== 'COMPLETED' && Object.keys(brandInputs).length > 0) {
            setCurrentState('COMPLETED');
            setTimeout(handleClose, 6000); 
        }
    }, [currentStepIndex, currentState, brandInputs]);
    
    const handleClose = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (Object.keys(brandInputs).length === CONSULTATION_STEPS.length) {
            setLastVoiceConsultationResult(brandInputs as BrandInputs);
            playSound('success');
        }
        
        onClose();
        setTimeout(() => { 
            setCurrentState('IDLE'); setBrandInputs({}); setCurrentStepIndex(-1);
        }, 300);
    }, [brandInputs, onClose, setLastVoiceConsultationResult]);

    if (!show) return null;

    const ConsultationChecklist = () => (
        <div className="space-y-2 mt-4 text-left">
            {CONSULTATION_STEPS.map((stepKey, index) => (
                <div key={stepKey as string} className={`flex items-start transition-all duration-300 ${index > currentStepIndex ? 'opacity-40' : 'opacity-100'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 ${brandInputs[stepKey] ? 'bg-green-500' : (index === currentStepIndex ? 'bg-primary animate-pulse' : 'bg-border-main')}`}>
                       {brandInputs[stepKey] && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-text-header capitalize">{(stepKey as string).replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-text-body truncate max-w-xs">{brandInputs[stepKey] || '...'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const StateIndicator = () => {
        let text, icon, colorClass = "text-accent";
        switch (currentState) {
            case 'LISTENING': text = "Mang AI sedang mendengarkan..."; icon = "🎤"; break;
            case 'ANALYZING': text = "Menganalisa jawaban..."; icon = "🤔"; break;
            case 'SPEAKING': text = "Mang AI sedang berbicara..."; icon = "💬"; break;
            case 'COMPLETED': text = "Konsultasi Selesai!"; icon = "✅"; colorClass="text-green-500"; break;
            default: return null;
        }
        return <div className={`text-sm ${colorClass} animate-pulse mt-2 font-semibold flex items-center justify-center gap-2`}><span>{icon}</span> {text}</div>
    }

    const renderContent = () => {
        switch (currentState) {
            case 'IDLE':
                return (
                    <>
                        <p className="text-text-body mt-2 mb-6 text-center">Mang AI akan menjadi konsultan pribadimu untuk menggali DNA brand lewat sesi tanya jawab suara yang interaktif.</p>
                        <button onClick={handleStartConsultation} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors">Mulai Konsultasi Suara</button>
                    </>
                );
            case 'REQUESTING_MIC':
                return <p className="text-center text-text-muted">Meminta izin mikrofon...</p>;
            case 'LISTENING':
            case 'ANALYZING':
            case 'SPEAKING':
            case 'COMPLETED':
                 return (
                    <>
                        <StateIndicator/>
                        <div className="relative h-16 w-full my-4 bg-background rounded-lg flex items-center justify-center overflow-hidden border border-border-main">
                           <p className="text-center text-text-body p-2 italic">"{liveTranscription}"</p>
                           {currentState === 'LISTENING' && <div className="absolute bottom-0 left-0 h-1 w-full bg-primary animate-pulse" />}
                           {currentState === 'ANALYZING' && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
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
                    <h2 className="text-xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Konsultan Suara Brand</h2>
                </div>
                <div className="mt-4 min-h-[250px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VoiceBrandingWizard;