// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateBusinessNames, generateQuickSlogans, generateMoodboardText, generateMoodboardImages, removeImageBackground, generateStagedProductImage } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useAIPet } from '../contexts/AIPetContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { useUI } from '../contexts/UIContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';

const NAME_GEN_COST = 1;
const SLOGAN_GEN_COST = 1;
const MOODBOARD_GEN_COST = 3;
const PRODUCT_STAGER_COST = 2; // 1 for BG removal, 1 for staging
const XP_REWARD = 15;

const QUICK_TOOLS_TIPS = [
    { icon: '📸', title: 'BARU: Foto Panggung!', text: 'Ubah foto produk biasa dari HP jadi sekelas iklan profesional! Cukup upload foto, pilih suasana, dan biarkan Mang AI menciptakan panggung dramatis untuk produkmu.' },
    { icon: '⚡', title: 'Inspirasi Kilat, Hasil Cepat', text: 'Lagi butuh nama bisnis atau slogan keren dalam sekejap? Di sinilah tempatnya! Cukup kasih kata kunci, Mang AI langsung kasih ide.' },
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Moodboard Generator'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🖼️', title: 'Editor Gambar Simpel', text: "Udah punya gambar tapi mau ditambahin teks atau logo? Buka 'Sotoshop', editor gambar ringan yang terintegrasi dengan AI." },
];

const SCENES = [
    { id: 'luxury', name: 'Mewah Elegan', icon: '💎', prompt: 'on a dark marble pedestal with a single, soft spotlight from above, creating dramatic shadows. The background is dark and out of focus, with subtle bokeh lights.' },
    { id: 'nature', name: 'Alam Segar', icon: '🌿', prompt: 'on a mossy stone near a clear, gentle stream. The scene is filled with soft, morning sunlight filtering through lush green leaves, creating a fresh and organic feel.' },
    { id: 'minimalist', name: 'Studio Minimalis', icon: '⚪', prompt: 'floating in the center of a clean, minimalist studio with a solid, light-colored background. There is a single, soft, realistic shadow beneath the product.' },
    { id: 'urban', name: 'Urban Modern', icon: '🏙️', prompt: 'on a rough concrete surface at night, with vibrant, out-of-focus neon city lights in the background, creating a stylish and edgy atmosphere.' },
    { id: 'kitchen', name: 'Dapur Hangat', icon: '🍳', prompt: 'on a rustic wooden kitchen table, surrounded by related fresh ingredients (like coffee beans, flour, or herbs) in a cozy, warm lighting setting.' },
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

const QuickTools: React.FC = () => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const { toggleSotoshop } = useUI();
    const { petState } = useAIPet();
    const credits = profile?.credits ?? 0;
    
    const [activeTool, setActiveTool] = useState<'name' | 'slogan' | 'moodboard' | 'product_stager' | 'sotoshop'>('name');

    // Name Gen State
    const [nameCategory, setNameCategory] = useState('');
    const [nameKeywords, setNameKeywords] = useState('');

    // Slogan Gen State
    const [sloganBusinessName, setSloganBusinessName] = useState('');
    const [sloganKeywords, setSloganKeywords] = useState('');
    
    // Moodboard Gen State
    const [moodboardKeywords, setMoodboardKeywords] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);
    
    // Product Stager State
    const [productImage, setProductImage] = useState<string | null>(null);
    const [selectedScene, setSelectedScene] = useState<string | null>(null);
    const [stagedResult, setStagedResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Shared State
    const [results, setResults] = useState<{ title: string; items: string[] } | null>(null);
    const [displayedItems, setDisplayedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<{ active: boolean; step?: string }>({ active: false });
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
        setIsLoading({ active: true }); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateBusinessNames(nameCategory, nameKeywords, petState);
            await deductCredits(NAME_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `IDEAS FOR "${nameCategory.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading({ active: false }); }
    }, [nameCategory, nameKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal, petState]);
    
    const handleGenerateSlogans = useCallback(async () => {
        if (!sloganBusinessName) { setError('BUSINESS NAME CANNOT BE EMPTY!'); return; }
        if (credits < SLOGAN_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading({ active: true }); setError(null); setResults(null); playSound('start');
        try {
            const resultItems = await generateQuickSlogans(sloganBusinessName, sloganKeywords, petState);
            await deductCredits(SLOGAN_GEN_COST); await addXp(XP_REWARD);
            setResults({ title: `SLOGANS FOR "${sloganBusinessName.toUpperCase()}"`, items: resultItems });
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading({ active: false }); }
    }, [sloganBusinessName, sloganKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal, petState]);
    
    const handleGenerateMoodboard = useCallback(async () => {
        if (!moodboardKeywords) { setError('KEYWORDS CANNOT BE EMPTY!'); return; }
        if (credits < MOODBOARD_GEN_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading({ active: true }); setError(null); setMoodboardResult(null); playSound('start');
        try {
            const [textData, images] = await Promise.all([
                generateMoodboardText(moodboardKeywords, petState),
                generateMoodboardImages(moodboardKeywords),
            ]);
            await deductCredits(MOODBOARD_GEN_COST); await addXp(XP_REWARD + 10);
            setMoodboardResult({ ...textData, images });
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading({ active: false }); }
    }, [moodboardKeywords, credits, deductCredits, addXp, setShowOutOfCreditsModal, petState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProductImage(event.target?.result as string);
                setStagedResult(null); // Clear previous result
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateProductStage = useCallback(async () => {
        if (!productImage || !selectedScene) { setError('IMAGE AND SCENE MUST BE SELECTED!'); return; }
        if (credits < PRODUCT_STAGER_COST) { setShowOutOfCreditsModal(true); return; }
        setIsLoading({ active: true, step: 'Menghapus background...' }); setError(null); setStagedResult(null); playSound('start');
        try {
            const transparentProduct = await removeImageBackground(productImage);
            setIsLoading({ active: true, step: 'Membangun panggung dramatis...' });
            
            const scenePrompt = SCENES.find(s => s.id === selectedScene)?.prompt || '';
            const fullPrompt = `Take the provided product image (which has a transparent background). Place it in a dramatic, cinematic scene: ${scenePrompt}. The lighting should be professional and highlight the product. This should look like a high-end commercial advertisement photo. Ensure the product looks naturally integrated into the scene with realistic shadows and reflections.`;

            const finalImage = await generateStagedProductImage(transparentProduct, fullPrompt);

            await deductCredits(PRODUCT_STAGER_COST);
            await addXp(XP_REWARD + 20);
            setStagedResult(finalImage);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading({ active: false }); }
    }, [productImage, selectedScene, credits, deductCredits, addXp, setShowOutOfCreditsModal]);

    const handleToolChange = (tool: 'name' | 'slogan' | 'moodboard' | 'product_stager' | 'sotoshop') => {
        setActiveTool(tool); setError(null); setResults(null); setDisplayedItems([]); setMoodboardResult(null); setProductImage(null); setSelectedScene(null); setStagedResult(null);
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-splash mb-2">Generator Ide Kreatif</h2>
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
                                <button onClick={() => handleToolChange('product_stager')} className={`flex-1 font-mono font-bold py-2 text-xs sm:text-base transition-colors ${activeTool === 'product_stager' ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>FOTO PANGGUNG</button>
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                {activeTool === 'name' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">PRODUK/JASA:</label><input value={nameCategory} onChange={(e) => setNameCategory(e.target.value)} placeholder="cth: Kopi Susu Gula Aren" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KATA KUNCI (OPSIONAL):</label><input value={nameKeywords} onChange={(e) => setNameKeywords(e.target.value)} placeholder="cth: senja, santai, modern" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateNames} disabled={!nameCategory || isLoading.active} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading.active ? 'LOADING...' : `GENERATE NAMA (${NAME_GEN_COST} TOKEN)`}</button>
                                    </div>
                                ) : activeTool === 'slogan' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">NAMA BISNIS:</label><input value={sloganBusinessName} onChange={(e) => setSloganBusinessName(e.target.value)} placeholder="cth: Kopi Senja" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KATA KUNCI (OPSIONAL):</label><input value={sloganKeywords} onChange={(e) => setSloganKeywords(e.target.value)} placeholder="cth: santai, teman ngobrol" className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateSlogans} disabled={!sloganBusinessName || isLoading.active} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading.active ? 'LOADING...' : `GENERATE SLOGAN (${SLOGAN_GEN_COST} TOKEN)`}</button>
                                    </div>
                                 ) : activeTool === 'product_stager' ? (
                                    <div className="animate-content-fade-in space-y-4">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full font-mono text-lg font-bold bg-blue-500 text-white p-3 hover:bg-blue-400 transition-colors">1. UPLOAD FOTO PRODUK</button>
                                        {productImage && <div className="p-2 border-2 border-splash/50 bg-black/50"><img src={productImage} alt="Product preview" className="max-h-24 mx-auto" /></div>}
                                        {productImage && (
                                            <div>
                                                <p className="text-splash font-bold text-sm block mb-2">2. PILIH PANGGUNG:</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {SCENES.map(scene => (
                                                        <button key={scene.id} onClick={() => setSelectedScene(scene.id)} className={`p-2 font-mono text-xs text-center border-2 transition-colors ${selectedScene === scene.id ? 'bg-splash/20 border-splash' : 'bg-black/50 border-splash/50 hover:border-splash'}`}>
                                                            <span className="text-xl">{scene.icon}</span><br/>{scene.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button onClick={handleGenerateProductStage} disabled={!productImage || !selectedScene || isLoading.active} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading.active ? (isLoading.step || 'LOADING...') : `3. BUAT FOTO PANGGUNG (${PRODUCT_STAGER_COST} TOKEN)`}</button>
                                    </div>
                                ) : ( // Moodboard
                                     <div className="animate-content-fade-in space-y-4">
                                        <div className="space-y-2"><label className="text-splash font-bold text-sm block">KATA KUNCI/NUANSA:</label><input value={moodboardKeywords} onChange={(e) => setMoodboardKeywords(e.target.value)} placeholder="cth: rustic coffee shop, sunset, warm" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div>
                                        <button onClick={handleGenerateMoodboard} disabled={!moodboardKeywords || isLoading.active} className="w-full font-mono text-lg font-bold bg-yellow-400 text-black p-3 my-2 hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading.active ? 'LOADING...' : `GENERATE MOODBOARD (${MOODBOARD_GEN_COST} TOKEN)`}</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-h-[200px] border-t-2 border-splash/30 pt-4 overflow-y-auto">
                                {isLoading.active && <p className="text-center text-yellow-400">{isLoading.step || 'MANG AI IS THINKING'}<span className="blinking-cursor">...</span></p>}
                                {error && <p className="text-red-500 font-bold animate-pulse">ERROR: {error}</p>}
                                
                                {activeTool !== 'moodboard' && activeTool !== 'product_stager' && results && <p className="text-yellow-400 font-bold mb-2">{results.title}<span className="blinking-cursor">_</span></p>}
                                {activeTool !== 'moodboard' && activeTool !== 'product_stager' && displayedItems.length > 0 && (
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
                                            <p className="text-yellow-400 font-bold">NUANSA & RASA:</p>
                                            <p className="text-white text-sm italic selectable-text">{moodboardResult.description}</p>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">PALET WARNA:</p>
                                            <div className="flex gap-2 mt-1">{moodboardResult.palette.map(hex => <div key={hex} title={hex} className="w-6 h-6 border-2 border-splash/50" style={{backgroundColor: hex}}/>)}</div>
                                        </div>
                                         <div>
                                            <p className="text-yellow-400 font-bold">INSPIRASI VISUAL:</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">{moodboardResult.images.map((img, i) => <img key={i} src={img} alt={`Moodboard image ${i+1}`} className="w-full aspect-square object-cover border-2 border-splash/50"/>)}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTool === 'product_stager' && stagedResult && (
                                     <div className="space-y-2 animate-content-fade-in">
                                        <p className="text-yellow-400 font-bold">HASIL FOTO PANGGUNG:</p>
                                        <img src={stagedResult} alt="Staged product result" className="w-full border-2 border-splash/50"/>
                                        <a href={stagedResult} download="desainfun_foto_panggung.png" className="block w-full text-center font-mono text-lg font-bold bg-green-500 text-white p-3 my-2 hover:bg-green-400 transition-colors">UNDUH HASIL</a>
                                     </div>
                                )}

                            </div>
                            <p className="text-center text-xs text-splash/50">MANG AI SYSTEMS - READY PLAYER ONE - +{XP_REWARD} XP</p>
                        </div>
                    </div>
                    <div className="console-controls">
                       <div className="control-group">
                            <div className="toggle-switch on"><div className="switch-lever"></div></div>
                            <div className="toggle-switch on"><div className="switch-lever"></div></div>
                            <div className="toggle-switch on"><div className="switch-lever"></div></div>
                        </div>
                        <div className="control-group">
                            <button onClick={() => toggleSotoshop(true)} className="chunky-button blue" title="Buka Sotoshop (Editor Gambar)"></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickTools;
