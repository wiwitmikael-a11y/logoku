// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateBusinessNames, generateQuickSlogans, generateMoodboardText, generateMoodboardImages, generateSceneFromImages } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { useUI } from '../contexts/UIContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';
import ImageModal from './common/ImageModal';

const NAME_GEN_COST = 1;
const SLOGAN_GEN_COST = 1;
const MOODBOARD_GEN_COST = 3;
const SCENE_MIXER_COST = 2;
const XP_REWARD = 15;

const QUICK_TOOLS_TIPS = [
    { icon: '⚡', title: 'Inspirasi Kilat, Hasil Cepat', text: 'Lagi butuh nama bisnis atau slogan keren dalam sekejap? Di sinilah tempatnya! Cukup kasih kata kunci, Mang AI langsung kasih ide.' },
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Moodboard Generator'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🖼️', title: 'Editor Gambar Simpel', text: "Udah punya gambar tapi mau ditambahin teks atau logo? Buka 'Sotoshop', editor gambar ringan yang terintegrasi dengan AI." },
    { icon: '🚀', title: 'Naik Level Sambil Cari Ide', text: 'Setiap generator di sini ngasih <strong class="text-text-header">+15 XP</strong>. Cara gampang buat naikin level sambil nyari inspirasi!' },
    { icon: '🧩', title: 'Gabungkan Imajinasimu!', text: 'Pakai <strong class="text-text-header">Scene Mixer</strong> buat gabungin beberapa gambar jadi satu. Upload gambar-gambarmu, kasih perintah, dan biarkan Mang AI yang menyatukannya!' },
];

const QuickToolsInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => { setCurrentTipIndex(prev => (prev + 1) % QUICK_TOOLS_TIPS.length); }, 7000);
        return () => clearInterval(interval);
    }, []);

    const currentTip = QUICK_TOOLS_TIPS[currentTipIndex];

    return (
        <div key={currentTipIndex} className="w-full bg-surface border border-border-main rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in shadow-lg shadow-black/20">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-primary">{currentTip.title}</h4>
                <p className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
        </div>
    );
};

interface QuickToolsProps {
    onShowSotoshop: () => void;
}

interface SceneImage {
  src: string;
  instruction: string;
}

const QuickTools: React.FC<QuickToolsProps> = ({ onShowSotoshop }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const credits = profile?.credits ?? 0;
    
    const [activeTool, setActiveTool] = useState<'name' | 'slogan' | 'moodboard' | 'sotoshop' | 'scenemixer'>('name');

    // Name Gen State
    const [nameCategory, setNameCategory] = useState('');
    const [nameKeywords, setNameKeywords] = useState('');

    // Slogan Gen State
    const [sloganBusinessName, setSloganBusinessName] = useState('');
    const [sloganKeywords, setSloganKeywords] = useState('');
    
    // Moodboard Gen State
    const [moodboardKeywords, setMoodboardKeywords] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);
    
    // Scene Mixer State
    const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
    const [scenePrompt, setScenePrompt] = useState('');
    const [sceneResult, setSceneResult] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);


    // Shared State
    const [results, setResults] = useState<{ title: string; items: string[] } | null>(null);
    const [displayedItems, setDisplayedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Typing effect for results
    useEffect(() => {
        if (results && results.items.length > 0) {
            setDisplayedItems([]);
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedItems(prev => [...prev, results.items[i]]);
                playSound('typing');
                i++;
                if (i >= results.items.length) {
                    clearInterval(interval);
                    playSound('success');
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [results]);


    const handleGenerateNames = useCallback(async () => {
        if (!nameCategory) { setError('PRODUCT/SERVICE CANNOT BE EMPTY!'); return; }
        if (credits < NAME_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateBusinessNames(nameCategory, nameKeywords);
            await deductCredits(NAME_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `IDEAS FOR "${nameCategory.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [nameCategory, nameKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);
    
    const handleGenerateSlogans = useCallback(async () => {
        if (!sloganBusinessName) { setError('BUSINESS NAME CANNOT BE EMPTY!'); return; }
        if (credits < SLOGAN_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateQuickSlogans(sloganBusinessName, sloganKeywords);
            await deductCredits(SLOGAN_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `SLOGANS FOR "${sloganBusinessName.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [sloganBusinessName, sloganKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);
    
    const handleGenerateMoodboard = useCallback(async () => {
        if (!moodboardKeywords) { setError('KEYWORDS CANNOT BE EMPTY!'); return; }
        if (credits < MOODBOARD_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setError(null); setMoodboardResult(null); playSound('start');
        try {
            const [textData, images] = await Promise.all([
                generateMoodboardText(moodboardKeywords),
                generateMoodboardImages(moodboardKeywords),
            ]);
            await deductCredits(MOODBOARD_GEN_COST); await addXp(XP_REWARD + 10);
            setMoodboardResult({ ...textData, images });
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [moodboardKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    const handleFileChange = (files: FileList) => {
        setError(null);
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                setError(`File ${file.name} bukan gambar!`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                setSceneImages(prev => [...prev, { src: e.target?.result as string, instruction: '' }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleInstructionChange = (index: number, instruction: string) => {
        setSceneImages(prev => {
            const newImages = [...prev];
            newImages[index].instruction = instruction;
            return newImages;
        });
    };
    
    const handleGenerateScene = useCallback(async () => {
        if (sceneImages.length === 0) { setError('UPLOAD MINIMAL 1 GAMBAR!'); return; }
        if (!scenePrompt) { setError('PROMPT UTAMA TIDAK BOLEH KOSONG!'); return; }
        if (credits < SCENE_MIXER_COST) { setShowOutOfCreditsModal(true); return; }

        setIsLoading(true); setError(null); setSceneResult(null); playSound('start');

        try {
            let combinedPrompt = `${scenePrompt}\n\n--- Instruksi Spesifik untuk Setiap Gambar ---\n`;
            sceneImages.forEach((image, index) => {
                if (image.instruction.trim()) {
                    combinedPrompt += `Gambar ${index + 1}: Fokus pada "${image.instruction.trim()}".\n`;
                } else {
                    combinedPrompt += `Gambar ${index + 1}: Gunakan elemen yang paling relevan dari gambar ini.\n`;
                }
            });

            const resultImage = await generateSceneFromImages(sceneImages.map(img => img.src), combinedPrompt);
            await deductCredits(SCENE_MIXER_COST); await addXp(XP_REWARD + 10);
            setSceneResult(resultImage);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    }, [sceneImages, scenePrompt, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    const handleToolChange = (tool: 'name' | 'slogan' | 'moodboard' | 'sotoshop' | 'scenemixer') => {
        setActiveTool(tool); setError(null); setResults(null); setDisplayedItems([]); setMoodboardResult(null); setSceneImages([]); setScenePrompt(''); setSceneResult(null);
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <div className="text-center">
                <p className="text-text-muted">
                    Butuh inspirasi cepat? Di sini tempatnya! Mang AI sediain alat-alat bantu praktis buat kebutuhan branding dadakan lo.
                </p>
            </div>
            
            <QuickToolsInfoBox />

            <div className="creative-console-wrapper">
                <div className="creative-console">
                    <div className="console-header">
                        <h2 className="console-title">Generator Ide Kreatif</h2>
                    </div>
                    <div className="console-monitor-frame">
                        <div className="crt-screen p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
                            
                            {/* --- TABS --- */}
                            <div className="flex border-b-2 border-splash/50">
                                <button onClick={() => handleToolChange('name')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'name' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>NAME GEN</button>
                                <button onClick={() => handleToolChange('slogan')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'slogan' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>SLOGAN GEN</button>
                                <button onClick={() => handleToolChange('moodboard')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'moodboard' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>MOODBOARD</button>
                                <button onClick={() => handleToolChange('scenemixer')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'scenemixer' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>SCENE MIXER</button>
                                <button onClick={() => handleToolChange('sotoshop')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'sotoshop' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>SOTOSHOP</button>
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                {activeTool === 'name' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">PRODUCT/SERVICE:</label><input value={nameCategory} onChange={(e) => setNameCategory(e.target.value)} placeholder="e.g., Kopi Susu Gula Aren" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS (OPTIONAL):</label><input value={nameKeywords} onChange={(e) => setNameKeywords(e.target.value)} placeholder="e.g., senja, santai, modern" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateNames} disabled={!nameCategory || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${NAME_GEN_COST} TOKEN)`}</button>
                                    </div>
                                ) : activeTool === 'slogan' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">BUSINESS NAME:</label><input value={sloganBusinessName} onChange={(e) => setSloganBusinessName(e.target.value)} placeholder="e.g., Kopi Senja" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS (OPTIONAL):</label><input value={sloganKeywords} onChange={(e) => setSloganKeywords(e.target.value)} placeholder="e.g., santai, temen ngobrol" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateSlogans} disabled={!sloganBusinessName || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${SLOGAN_GEN_COST} TOKEN)`}</button>
                                    </div>
                                ) : activeTool === 'sotoshop' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <p className="text-splash font-bold text-sm">SOTOSHOP (IMAGE EDITOR):</p>
                                        <p className="text-white text-sm">Editor gambar ringan yang powerful, terintegrasi langsung dengan Mang AI. Gunakan untuk memoles logo, menambah teks ke gambar postingan, atau bahkan membuat desain sederhana dari nol.</p>
                                        <p className="text-xs text-text-muted">Fitur unggulannya termasuk background removal dan AI image generation langsung di kanvas.</p>
                                        {/* FIX: Use onShowSotoshop from props instead of the undefined toggleSotoshop */}
                                        <button onClick={onShowSotoshop} className="w-full font-mono text-lg font-bold bg-fuchsia-500 text-white p-3 my-2 hover:bg-fuchsia-400 transition-colors">
                                            BUKA SOTOSHOP
                                        </button>
                                    </div>
                                ) : activeTool === 'scenemixer' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div 
                                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                                            className={`p-4 border-2 border-dashed border-splash/50 rounded-none min-h-[80px] flex flex-col justify-center items-center transition-colors ${isDragging ? 'dropzone-active' : ''}`}
                                        >
                                            <p className="text-splash font-bold text-sm">DROP YOUR IMAGES HERE</p>
                                            <p className="text-xs text-text-muted">or</p>
                                            <label htmlFor="file-upload" className="cursor-pointer text-yellow-400 hover:underline font-semibold">CHOOSE FILES</label>
                                            <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && handleFileChange(e.target.files)} />
                                        </div>
                                        {sceneImages.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-black/50 border border-splash/30 max-h-48 overflow-y-auto">
                                                {sceneImages.map((img, i) => (
                                                    <div key={i} className="relative bg-black/30 p-1 space-y-1">
                                                        <img src={img.src} className="w-full h-16 object-cover" />
                                                        <input value={img.instruction} onChange={(e) => handleInstructionChange(i, e.target.value)} placeholder="e.g., 'the cat'" className="w-full text-xs font-mono bg-black/50 border border-splash/50 rounded-none p-1 text-white focus:outline-none focus:border-splash" />
                                                        <button onClick={() => setSceneImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-xs font-bold leading-none">&times;</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">PROMPT UTAMA:</label><textarea value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} placeholder="e.g., Gabungkan kucing ke pantai..." required rows={2} className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateScene} disabled={sceneImages.length === 0 || !scenePrompt || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'MIXING...' : `START MIXER (${SCENE_MIXER_COST} TOKEN)`}</button>
                                    </div>
                                ) : ( // Moodboard
                                     <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS/VIBE:</label><input value={moodboardKeywords} onChange={(e) => setMoodboardKeywords(e.target.value)} placeholder="e.g., rustic coffee shop, sunset, warm" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateMoodboard} disabled={!moodboardKeywords || isLoading} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'LOADING...' : `START GAME (${MOODBOARD_GEN_COST} TOKEN)`}</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-h-[200px] border-t-2 border-splash/30 pt-4 overflow-y-auto">
                                {isLoading && <p className="text-center text-yellow-400">MANG AI IS THINKING<span className="blinking-cursor">...</span></p>}
                                {error && <p className="text-red-500 font-bold animate-pulse">ERROR: {error}</p>}
                                
                                {activeTool !== 'moodboard' && activeTool !== 'sotoshop' && activeTool !== 'scenemixer' && results && <p className="text-yellow-400 font-bold mb-2">{results.title}<span className="blinking-cursor">_</span></p>}
                                {activeTool !== 'moodboard' && activeTool !== 'sotoshop' && activeTool !== 'scenemixer' && displayedItems.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                        {displayedItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 animate-content-fade-in">
                                                <span className="text-splash font-bold">&gt;</span>
                                                <span className="text-white flex-grow selectable-text">{item}</span>
                                                <CopyButton textToCopy={item} className="!bg-black/50 !text-splash hover:!bg-splash/20" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTool === 'moodboard' && moodboardResult && (
                                    <div className="space-y-4 animate-content-fade-in">
                                        <div>
                                            <p className="text-yellow-400 font-bold">MOOD & FEEL:</p>
                                            <p className="text-white text-sm italic selectable-text">{moodboardResult.description}</p>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">COLOR PALETTE:</p>
                                            <div className="flex gap-2 mt-1">{moodboardResult.palette.map(hex => <div key={hex} title={hex} className="w-6 h-6 border-2 border-splash/50" style={{backgroundColor: hex}}/>)}</div>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">VISUAL INSPIRATION:</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">{moodboardResult.images.map((img, i) => <img key={i} src={img} alt={`Moodboard image ${i+1}`} className="w-full aspect-square object-cover border-2 border-splash/50"/>)}</div>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'scenemixer' && sceneResult && (
                                    <div className="space-y-4 animate-content-fade-in">
                                        <div>
                                            <p className="text-yellow-400 font-bold">MIXED SCENE RESULT:</p>
                                            <img src={sceneResult} alt="Generated scene" className="w-full mt-2 border-2 border-splash/50 cursor-pointer" onClick={() => setModalImageUrl(sceneResult)} />
                                        </div>
                                    </div>
                                )}

                            </div>
                            <p className="text-center text-xs text-splash/50">MANG AI SYSTEMS - READY PLAYER ONE - +{XP_REWARD} XP</p>
                        </div>
                    </div>
                    <div className="console-controls">
                       <div className="control-group">
                            <div className="toggle-switch"><div className="switch-lever"></div></div>
                            <div className="toggle-switch on"><div className="switch-lever"></div></div>
                            <div className="toggle-switch"><div className="switch-lever"></div></div>
                        </div>
                        <div className="control-group">
                            <div className="chunky-button red"></div>
                            <div className="chunky-button blue"></div>
                        </div>
                    </div>
                </div>
            </div>
             {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText="Generated Scene" onClose={() => setModalImageUrl(null)} />)}
        </div>
    );
};

export default QuickTools;
