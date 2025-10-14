// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect } from 'react';
import { 
    generateMoodboardText, 
    generateMoodboardImages, 
    generateSceneFromImages,
    generatePattern,
    generateProductPhoto,
    generateMascot
} from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import CopyButton from './common/CopyButton';
import ImageModal from './common/ImageModal';

const NAME_GEN_COST = 1;
const SLOGAN_GEN_COST = 1;
const MOODBOARD_GEN_COST = 3;
const SCENE_MIXER_COST = 2;
const PATTERN_COST = 2;
const PHOTO_STUDIO_COST = 2;
const MASCOT_COST = 2;
const XP_REWARD = 15;

const AI_CREATOR_TIPS = [
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Moodboard Generator'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🧩', title: 'Gabungkan Imajinasimu!', text: 'Pakai <strong class="text-text-header">Scene Mixer</strong> buat gabungin beberapa gambar jadi satu. Upload gambar-gambarmu, kasih perintah, dan biarkan Mang AI yang menyatukannya!' },
    { icon: '🌀', title: 'Desain Pola Unik!', text: 'Butuh motif buat kemasan atau background? Pakai <strong class="text-text-header">Pattern Generator</strong> buat bikin pola seamless yang keren.'},
    { icon: '📸', title: 'Foto Produk Profesional', text: 'Upload foto produkmu dan biarkan <strong class="text-text-header">Photo Studio AI</strong> menempatkannya di berbagai suasana. Gak perlu sewa studio mahal!'},
    { icon: '🐻', title: 'Lahirkan Maskot Brand-mu', text: 'Ciptakan karakter yang mudah diingat untuk brand-mu dengan <strong class="text-text-header">Mascot Generator</strong>. Cukup deskripsikan, dan Mang AI akan menggambarnya.'},
    { icon: '🖼️', title: 'Editor Gambar Simpel', text: "Udah punya gambar tapi mau ditambahin teks atau logo? Buka 'Sotoshop', editor gambar ringan yang terintegrasi dengan AI." },
];

const AICreatorInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => { setCurrentTipIndex(prev => (prev + 1) % AI_CREATOR_TIPS.length); }, 7000);
        return () => clearInterval(interval);
    }, []);

    const currentTip = AI_CREATOR_TIPS[currentTipIndex];

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

interface AICreatorProps { onShowSotoshop: () => void; }
interface SceneImage { src: string; instruction: string; }

type CreatorTool = 'moodboard' | 'scenemixer' | 'pattern' | 'photostudio' | 'mascot' | 'sotoshop';

const AICreator: React.FC<AICreatorProps> = ({ onShowSotoshop }) => {
    const { profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const credits = profile?.credits ?? 0;
    
    const [activeTool, setActiveTool] = useState<CreatorTool>('moodboard');
    
    const [moodboardKeywords, setMoodboardKeywords] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<{description: string; palette: string[]; images: string[]} | null>(null);
    
    const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
    const [scenePrompt, setScenePrompt] = useState('');
    const [sceneResult, setSceneResult] = useState<string | null>(null);
    
    const [patternPrompt, setPatternPrompt] = useState('');
    const [patternResult, setPatternResult] = useState<string | null>(null);

    const [productImage, setProductImage] = useState<string | null>(null);
    const [productScenePrompt, setProductScenePrompt] = useState('');
    const [productPhotoResult, setProductPhotoResult] = useState<string | null>(null);

    const [mascotPrompt, setMascotPrompt] = useState('');
    const [mascotResults, setMascotResults] = useState<string[]>([]);
    
    const [isDragging, setIsDragging] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (isLoading) return;
        setIsLoading(true); setError(null); playSound('start');
        
        const toolMap: { [K in CreatorTool]?: { cost: number; xp: number; handler: () => Promise<void> } } = {
            moodboard: { cost: MOODBOARD_GEN_COST, xp: XP_REWARD + 10, handler: async () => { if (!moodboardKeywords) throw new Error('KEYWORDS CANNOT BE EMPTY!'); const [textData, images] = await Promise.all([generateMoodboardText(moodboardKeywords), generateMoodboardImages(moodboardKeywords)]); setMoodboardResult({ ...textData, images }); } },
            scenemixer: { cost: SCENE_MIXER_COST, xp: XP_REWARD + 10, handler: async () => { if (sceneImages.length === 0) throw new Error('UPLOAD MINIMAL 1 GAMBAR!'); if (!scenePrompt) throw new Error('PROMPT UTAMA TIDAK BOLEH KOSONG!'); let p = `${scenePrompt}\n\n`; sceneImages.forEach((img, i) => { p += `Gambar ${i + 1}: ${img.instruction.trim() || 'Gunakan elemen relevan'}.\n`; }); const res = await generateSceneFromImages(sceneImages.map(i => i.src), p); setSceneResult(res); } },
            pattern: { cost: PATTERN_COST, xp: XP_REWARD, handler: async () => { if (!patternPrompt) throw new Error('PROMPT CANNOT BE EMPTY!'); const res = await generatePattern(patternPrompt); setPatternResult(res[0]); } },
            photostudio: { cost: PHOTO_STUDIO_COST, xp: XP_REWARD + 15, handler: async () => { if (!productImage) throw new Error('UPLOAD FOTO PRODUK DULU!'); if (!productScenePrompt) throw new Error('DESKRIPSI SUASANA TIDAK BOLEH KOSONG!'); const res = await generateProductPhoto(productImage, productScenePrompt); setProductPhotoResult(res); } },
            mascot: { cost: MASCOT_COST, xp: XP_REWARD, handler: async () => { if (!mascotPrompt) throw new Error('DESKRIPSI MASKOT TIDAK BOLEH KOSONG!'); const res = await generateMascot(mascotPrompt); setMascotResults(res); } },
        };
        
        const currentTool = toolMap[activeTool];
        if (!currentTool) { setIsLoading(false); return; }

        if (credits < currentTool.cost) { setShowOutOfCreditsModal(true); setIsLoading(false); return; }

        try {
            await currentTool.handler();
            await deductCredits(currentTool.cost);
            await addXp(currentTool.xp);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    };

    const handleFileChange = (files: FileList | null, forTool: 'scenemixer' | 'photostudio') => {
        setError(null);
        if (!files || files.length === 0) return;
        
        if (forTool === 'photostudio') {
            const file = files[0];
            if (!file.type.startsWith('image/')) { setError(`File bukan gambar!`); return; }
            const reader = new FileReader();
            reader.onload = (e) => setProductImage(e.target?.result as string);
            reader.readAsDataURL(file);
        } else { // scenemixer
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) { setError(`File ${file.name} bukan gambar!`); return; }
                const reader = new FileReader();
                reader.onload = (e) => setSceneImages(prev => [...prev, { src: e.target?.result as string, instruction: '' }]);
                reader.readAsDataURL(file);
            });
        }
    };

    const handleToolChange = (tool: CreatorTool) => {
        setActiveTool(tool); setError(null);
        // Reset all results
        setMoodboardResult(null); setSceneImages([]); setScenePrompt(''); setSceneResult(null);
        setPatternPrompt(''); setPatternResult(null);
        setProductImage(null); setProductScenePrompt(''); setProductPhotoResult(null);
        setMascotPrompt(''); setMascotResults([]);
    };

    const toolsConfig = [
        { id: 'moodboard', icon: '🎨', label: 'MOODBOARD' },
        { id: 'scenemixer', icon: '🧩', label: 'SCENE MIXER' },
        { id: 'pattern', icon: '🌀', label: 'PATTERN' },
        { id: 'photostudio', icon: '📸', label: 'PHOTO STUDIO' },
        { id: 'mascot', icon: '🐻', label: 'MASCOT' },
        { id: 'sotoshop', icon: '✨', label: 'SOTOSHOP' },
    ];

    const renderActiveToolUI = () => {
        switch (activeTool) {
            case 'moodboard': return <div className="animate-content-fade-in space-y-4"><div className="space-y-2"><label className="text-splash font-bold text-sm block">KEYWORDS/VIBE:</label><input value={moodboardKeywords} onChange={(e) => setMoodboardKeywords(e.target.value)} placeholder="e.g., rustic coffee shop, sunset, warm" required className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div><Button onClick={handleGenerate} disabled={!moodboardKeywords || isLoading} className="w-full" variant="accent">{isLoading ? 'LOADING...' : `GENERATE (${MOODBOARD_GEN_COST} TOKEN)`}</Button></div>;
            case 'scenemixer': return <div className="animate-content-fade-in space-y-4"><div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files, 'scenemixer'); }} className={`p-4 border-2 border-dashed border-splash/50 rounded-none min-h-[80px] flex flex-col justify-center items-center transition-colors ${isDragging ? 'dropzone-active' : ''}`}><p className="text-splash font-bold text-sm">DROP YOUR IMAGES HERE</p><p className="text-xs text-text-muted">or</p><label htmlFor="file-upload" className="cursor-pointer text-yellow-400 hover:underline font-semibold">CHOOSE FILES</label><input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files, 'scenemixer')} /></div>{sceneImages.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-black/50 border border-splash/30 max-h-48 overflow-y-auto">{sceneImages.map((img, i) => (<div key={i} className="relative bg-black/30 p-1 space-y-1"><img src={img.src} className="w-full h-16 object-cover" /><input value={img.instruction} onChange={(e) => setSceneImages(p => { const n = [...p]; n[i].instruction = e.target.value; return n; })} placeholder="e.g., 'the cat'" className="w-full text-xs font-mono bg-black/50 border border-splash/50 rounded-none p-1 text-white focus:outline-none focus:border-splash" /><button onClick={() => setSceneImages(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-xs font-bold leading-none">&times;</button></div>))}</div>}<div className="space-y-2"><label className="text-splash font-bold text-sm block">PROMPT UTAMA:</label><textarea value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} placeholder="e.g., Gabungkan kucing ke pantai..." required rows={2} className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div><Button onClick={handleGenerate} disabled={sceneImages.length === 0 || !scenePrompt || isLoading} className="w-full" variant="accent">{isLoading ? 'MIXING...' : `START MIXER (${SCENE_MIXER_COST} TOKEN)`}</Button></div>;
            case 'pattern': return <div className="animate-content-fade-in space-y-4"><div className="space-y-2"><label className="text-splash font-bold text-sm block">DESKRIPSI POLA:</label><textarea value={patternPrompt} onChange={(e) => setPatternPrompt(e.target.value)} placeholder="e.g., batik modern, warna pastel, bunga melati" required rows={3} className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div><Button onClick={handleGenerate} disabled={!patternPrompt || isLoading} className="w-full" variant="accent">{isLoading ? 'LOADING...' : `GENERATE (${PATTERN_COST} TOKEN)`}</Button></div>;
            case 'photostudio': return <div className="animate-content-fade-in space-y-4">{!productImage ? <div className={`p-4 border-2 border-dashed border-splash/50 rounded-none min-h-[80px] flex flex-col justify-center items-center`}><p className="text-splash font-bold text-sm">UPLOAD FOTO PRODUK</p><label htmlFor="product-upload" className="cursor-pointer text-yellow-400 hover:underline font-semibold mt-1">PILIH 1 FILE</label><input id="product-upload" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files, 'photostudio')} /></div> : <div className="p-2 bg-black/50 border border-splash/30"><img src={productImage} className="w-full max-h-32 object-contain" /></div>}<div className="space-y-2"><label className="text-splash font-bold text-sm block">DESKRIPSI SUASANA:</label><textarea value={productScenePrompt} onChange={(e) => setProductScenePrompt(e.target.value)} placeholder="e.g., di atas meja marmer dengan daun tropis di sekitarnya" required rows={2} className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div><Button onClick={handleGenerate} disabled={!productImage || !productScenePrompt || isLoading} className="w-full" variant="accent">{isLoading ? 'PROCESSING...' : `GENERATE (${PHOTO_STUDIO_COST} TOKEN)`}</Button></div>;
            case 'mascot': return <div className="animate-content-fade-in space-y-4"><div className="space-y-2"><label className="text-splash font-bold text-sm block">DESKRIPSI MASKOT:</label><textarea value={mascotPrompt} onChange={(e) => setMascotPrompt(e.target.value)} placeholder="e.g., beruang madu imut pakai blangkon, gaya kartun ceria" required rows={3} className="w-full font-mono bg-black/50 border-2 border-splash/50 rounded-none p-2 text-white focus:outline-none focus:border-splash focus:ring-2 focus:ring-splash/50" /></div><Button onClick={handleGenerate} disabled={!mascotPrompt || isLoading} className="w-full" variant="accent">{isLoading ? 'LOADING...' : `GENERATE (${MASCOT_COST} TOKEN)`}</Button></div>;
            case 'sotoshop': return <div className="animate-content-fade-in space-y-4"><p className="text-splash font-bold text-sm">SOTOSHOP (IMAGE EDITOR):</p><p className="text-white text-sm">Editor gambar ringan yang powerful. Gunakan untuk memoles logo, menambah teks, atau bahkan membuat desain sederhana dari nol.</p><p className="text-xs text-text-muted">Fitur unggulannya termasuk background removal dan AI image generation langsung di kanvas.</p><Button onClick={onShowSotoshop} className="w-full" variant="splash">BUKA SOTOSHOP</Button></div>;
            default: return null;
        }
    }

    const renderResults = () => {
        if (isLoading) return <p className="text-center text-yellow-400">MANG AI IS THINKING<span className="blinking-cursor">...</span></p>;
        if (error) return <p className="text-red-500 font-bold animate-pulse">ERROR: {error}</p>;
        switch(activeTool) {
            case 'moodboard': return moodboardResult && <div className="space-y-4 animate-content-fade-in"><div><p className="text-yellow-400 font-bold">MOOD & FEEL:</p><p className="text-white text-sm italic selectable-text">{moodboardResult.description}</p></div><div><p className="text-yellow-400 font-bold">COLOR PALETTE:</p><div className="flex gap-2 mt-1">{moodboardResult.palette.map(hex => <div key={hex} title={hex} className="w-6 h-6 border-2 border-splash/50" style={{backgroundColor: hex}}/>)}</div></div><div><p className="text-yellow-400 font-bold">VISUAL INSPIRATION:</p><div className="grid grid-cols-2 gap-2 mt-2">{moodboardResult.images.map((img, i) => <img key={i} src={img} alt={`Moodboard image ${i+1}`} className="w-full aspect-square object-cover border-2 border-splash/50"/>)}</div></div></div>;
            case 'scenemixer': return sceneResult && <div className="space-y-4 animate-content-fade-in"><div><p className="text-yellow-400 font-bold">MIXED SCENE RESULT:</p><img src={sceneResult} alt="Generated scene" className="w-full mt-2 border-2 border-splash/50 cursor-pointer" onClick={() => setModalImageUrl(sceneResult)} /></div></div>;
            case 'pattern': return patternResult && <div className="space-y-2 animate-content-fade-in"><div><p className="text-yellow-400 font-bold">GENERATED PATTERN:</p><div className="w-full h-48 border-2 border-splash/50 mt-2 cursor-pointer" style={{backgroundImage: `url(${patternResult})`, backgroundSize: '100px 100px'}} onClick={() => setModalImageUrl(patternResult)}></div></div></div>;
            case 'photostudio': return productPhotoResult && <div className="space-y-4 animate-content-fade-in"><div><p className="text-yellow-400 font-bold">PRODUCT PHOTO RESULT:</p><div className="grid grid-cols-2 gap-2 mt-2"><div className="border border-splash/30 p-1"><p className="text-xs text-center text-text-muted mb-1">Before</p><img src={productImage!} alt="Original product" className="w-full"/></div><div className="border-2 border-splash/50 p-1"><p className="text-xs text-center text-text-muted mb-1">After</p><img src={productPhotoResult} alt="Generated product photo" className="w-full cursor-pointer" onClick={() => setModalImageUrl(productPhotoResult)}/></div></div></div></div>;
            case 'mascot': return mascotResults.length > 0 && <div className="space-y-2 animate-content-fade-in"><div><p className="text-yellow-400 font-bold">MASCOT OPTIONS:</p><div className="grid grid-cols-2 gap-2 mt-2">{mascotResults.map((img, i) => <img key={i} src={img} alt={`Mascot option ${i+1}`} className="w-full aspect-square object-cover border-2 border-splash/50 cursor-pointer" onClick={() => setModalImageUrl(img)}/>)}</div></div></div>;
            default: return <p className="text-center text-splash/50 text-sm">SELECT A TOOL AND PRESS 'START'</p>;
        }
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <AICreatorInfoBox />
            <div className="creative-console-wrapper">
                <div className="creative-console">
                    <div className="console-header"><h2 className="console-title">AI Creator</h2></div>
                    <div className="console-monitor-frame">
                        <div className="crt-screen p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
                            <div className="flex border-b-2 border-splash/50 overflow-x-auto">
                                {toolsConfig.map(tool => (
                                    <button key={tool.id} onClick={() => handleToolChange(tool.id as CreatorTool)} className={`flex items-center gap-1.5 flex-shrink-0 font-mono font-bold py-2 px-3 text-xs sm:text-base transition-colors ${activeTool === tool.id ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}><span>{tool.icon}</span><span>{tool.label}</span></button>
                                ))}
                            </div>
                            <div className="flex-grow space-y-4">{renderActiveToolUI()}</div>
                            <div className="flex-grow min-h-[200px] border-t-2 border-splash/30 pt-4 overflow-y-auto">{renderResults()}</div>
                        </div>
                    </div>
                    <div className="console-controls"><div className="control-group"><div className="toggle-switch on"><div className="switch-lever"></div></div></div><div className="control-group"><div className="chunky-button red"></div></div></div>
                </div>
            </div>
             {modalImageUrl && (<ImageModal imageUrl={modalImageUrl} altText="Generated Scene" onClose={() => setModalImageUrl(null)} />)}
        </div>
    );
};

export default AICreator;