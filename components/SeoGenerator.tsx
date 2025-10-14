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
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { useUI } from '../contexts/UIContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';

const MOODBOARD_COST = 3;
const SCENE_MIXER_COST = 2;
const PATTERN_COST = 2;
const PHOTO_STUDIO_COST = 2;
const MASCOT_COST = 2;
const XP_REWARD = 25;

const AI_CREATOR_TIPS = [
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Moodboard Generator'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🧩', title: 'Gabungkan Imajinasimu!', text: 'Pakai <strong class="text-text-header">Scene Mixer</strong> buat gabungin beberapa gambar jadi satu. Upload gambar-gambarmu, kasih perintah, dan biarkan Mang AI yang menyatukannya!' },
    { icon: '🌀', title: 'Desain Pola Unik!', text: 'Butuh motif buat kemasan atau background? Pakai <strong class="text-text-header">Pattern Generator</strong> buat bikin pola seamless yang keren.'},
    { icon: '📸', title: 'Foto Produk Profesional', text: 'Upload foto produkmu dan biarkan <strong class="text-text-header">Photo Studio AI</strong> menempatkannya di berbagai suasana. Gak perlu sewa studio mahal!'},
    { icon: '🐻', title: 'Lahirkan Maskot Brand-mu', text: 'Ciptakan karakter yang mudah diingat untuk brand-mu dengan <strong class="text-text-header">Mascot Generator</strong>. Cukup deskripsikan, dan Mang AI akan menggambarnya.'},
    { icon: '💾', title: 'Simpan Karyamu!', text: 'Setiap hasil generator bisa kamu <strong class="text-text-header">simpan ke Lemari Kreasi</strong>. Kumpulin semua asetmu di sana biar gampang diakses lagi nanti!' },
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

interface AICreatorProps {
    onShowSotoshop: () => void;
}
interface SceneImage { src: string; instruction: string; }
type CreatorTool = 'moodboard' | 'scenemixer' | 'pattern' | 'photostudio' | 'mascot' | 'sotoshop';

const AICreator: React.FC<AICreatorProps> = ({ onShowSotoshop }) => {
    const { user, profile } = useAuth();
    const { deductCredits, addXp, setShowOutOfCreditsModal } = useUserActions();
    const credits = profile?.credits ?? 0;
    
    const [activeTool, setActiveTool] = useState<CreatorTool>('moodboard');
    
    // Tool States
    const [moodboardKeywords, setMoodboardKeywords] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<string | null>(null); // Now a single canvas image string
    const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
    const [scenePrompt, setScenePrompt] = useState('');
    const [sceneResult, setSceneResult] = useState<string | null>(null);
    const [patternPrompt, setPatternPrompt] = useState('');
    const [patternResult, setPatternResult] = useState<string | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [productScenePrompt, setProductScenePrompt] = useState('');
    const [productPhotoResult, setProductPhotoResult] = useState<string | null>(null);
    const [mascotPrompt, setMascotPrompt] = useState({ character: '', style: 'Stiker Lucu', accessories: '' });
    const [mascotResults, setMascotResults] = useState<string[]>([]);
    
    const [isDragging, setIsDragging] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        if (isLoading) return;
        setIsLoading(true); setError(null); playSound('start');
        
        const toolMap: { [K in CreatorTool]?: { cost: number; handler: () => Promise<void> } } = {
            moodboard: { cost: MOODBOARD_COST, handler: async () => { if (!moodboardKeywords) throw new Error('KEYWORDS CANNOT BE EMPTY!'); const [textData, images] = await Promise.all([generateMoodboardText(moodboardKeywords), generateMoodboardImages(moodboardKeywords)]); 
                const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 750; const ctx = canvas.getContext('2d'); if (!ctx) return;
                ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, 600, 750);
                const loadedImages = await Promise.all(images.map(src => new Promise<HTMLImageElement>(res => { const img = new Image(); img.src = src; img.onload = () => res(img); })));
                if (loadedImages[0]) ctx.drawImage(loadedImages[0], 10, 10, 380, 380);
                if (loadedImages[1]) ctx.drawImage(loadedImages[1], 400, 10, 190, 185);
                if (loadedImages[2]) ctx.drawImage(loadedImages[2], 400, 205, 190, 185);
                if (loadedImages[3]) ctx.drawImage(loadedImages[3], 10, 400, 580, 190);
                ctx.fillStyle = 'rgba(24, 24, 27, 0.7)'; ctx.fillRect(10, 600, 580, 140);
                ctx.font = 'bold 16px "Plus Jakarta Sans"'; ctx.fillStyle = '#fbbf24'; ctx.fillText('MOOD & FEEL:', 25, 630);
                ctx.font = '14px "Plus Jakarta Sans"'; ctx.fillStyle = '#e4e4e7'; let line = ''; let y = 655;
                const words = textData.description.split(' ');
                for (let n = 0; n < words.length; n++) { const testLine = line + words[n] + ' '; if (ctx.measureText(testLine).width > 350 && n > 0) { ctx.fillText(line, 25, y); line = words[n] + ' '; y += 20; } else { line = testLine; } }
                ctx.fillText(line, 25, y);
                textData.palette.forEach((hex, i) => { ctx.fillStyle = hex; ctx.fillRect(400 + i * 38, 650, 30, 30); ctx.fillStyle = '#e4e4e7'; ctx.font = '10px monospace'; ctx.fillText(hex, 400 + i * 38, 695); });
                setMoodboardResult(canvas.toDataURL('image/png'));
            } },
            scenemixer: { cost: SCENE_MIXER_COST, handler: async () => { if (sceneImages.length === 0) throw new Error('UPLOAD MINIMAL 1 GAMBAR!'); if (!scenePrompt) throw new Error('PROMPT UTAMA TIDAK BOLEH KOSONG!'); let p = `${scenePrompt}\n\n`; sceneImages.forEach((img, i) => { p += `Gambar ${i + 1}: ${img.instruction.trim() || 'Gunakan elemen relevan'}.\n`; }); const res = await generateSceneFromImages(sceneImages.map(i => i.src), p); setSceneResult(res); } },
            pattern: { cost: PATTERN_COST, handler: async () => { if (!patternPrompt) throw new Error('PROMPT CANNOT BE EMPTY!'); const res = await generatePattern(patternPrompt); setPatternResult(res[0]); } },
            photostudio: { cost: PHOTO_STUDIO_COST, handler: async () => { if (!productImage) throw new Error('UPLOAD FOTO PRODUK DULU!'); if (!productScenePrompt) throw new Error('DESKRIPSI SUASANA TIDAK BOLEH KOSONG!'); const res = await generateProductPhoto(productImage, productScenePrompt); setProductPhotoResult(res); } },
            mascot: { cost: MASCOT_COST, handler: async () => { const { character, style, accessories } = mascotPrompt; if (!character) throw new Error('DESKRIPSI KARAKTER TIDAK BOLEH KOSONG!'); const fullPrompt = `${character} in a ${style} style, ${accessories ? `wearing or holding ${accessories}` : ''}.`; const res = await generateMascot(fullPrompt); setMascotResults(res); } },
        };
        
        const currentTool = toolMap[activeTool];
        if (!currentTool) { setIsLoading(false); return; }

        if (credits < currentTool.cost) { setShowOutOfCreditsModal(true); setIsLoading(false); return; }

        try {
            await currentTool.handler();
            await deductCredits(currentTool.cost);
            await addXp(XP_REWARD);
            playSound('success');
        } catch (err) { setError(err instanceof Error ? err.message : 'SYSTEM_ERROR'); } finally { setIsLoading(false); }
    };

    const handleSaveToLemari = async () => {
        if (!user || isSaving) return;
        let asset_data: any = null; let name = '';
        switch(activeTool) {
            case 'moodboard': asset_data = { url: moodboardResult }; name = `Moodboard: ${moodboardKeywords}`; break;
            case 'scenemixer': asset_data = { url: sceneResult }; name = `Scene: ${scenePrompt}`; break;
            case 'pattern': asset_data = { url: patternResult }; name = `Pattern: ${patternPrompt}`; break;
            case 'photostudio': asset_data = { url: productPhotoResult, original: productImage }; name = `Photo: ${productScenePrompt}`; break;
            case 'mascot': asset_data = { urls: mascotResults }; name = `Mascot: ${mascotPrompt.character}`; break;
        }
        if (!asset_data) return;
        
        setIsSaving(true);
        const { error } = await supabase.from('lemari_kreasi').insert({ user_id: user.id, asset_type: activeTool, name: name.substring(0, 50), asset_data, });
        setIsSaving(false);
        if (error) { setError(`Gagal menyimpan: ${error.message}`); } 
        else { playSound('success'); alert('Aset berhasil disimpan ke Lemari Kreasi!'); }
    }

    const handleFileChange = (files: FileList | null, forTool: 'scenemixer' | 'photostudio') => {
        setError(null);
        if (!files || files.length === 0) return;
        if (forTool === 'photostudio') { const file = files[0]; if (!file.type.startsWith('image/')) { setError(`File bukan gambar!`); return; } const reader = new FileReader(); reader.onload = (e) => setProductImage(e.target?.result as string); reader.readAsDataURL(file); } 
        else { Array.from(files).forEach(file => { if (!file.type.startsWith('image/')) { setError(`File ${file.name} bukan gambar!`); return; } const reader = new FileReader(); reader.onload = (e) => setSceneImages(prev => [...prev, { src: e.target?.result as string, instruction: '' }]); reader.readAsDataURL(file); }); }
    };

    const handleToolChange = (tool: CreatorTool) => {
        setActiveTool(tool); setError(null);
        setMoodboardResult(null); setSceneImages([]); setScenePrompt(''); setSceneResult(null);
        setPatternPrompt(''); setPatternResult(null);
        setProductImage(null); setProductScenePrompt(''); setProductPhotoResult(null);
        setMascotPrompt({ character: '', style: 'Stiker Lucu', accessories: '' }); setMascotResults([]);
    };

    const toolsConfig = [ { id: 'moodboard', icon: '🎨', label: 'MOODBOARD' }, { id: 'pattern', icon: '🌀', label: 'PATTERN' }, { id: 'mascot', icon: '🐻', label: 'MASCOT' }, { id: 'photostudio', icon: '📸', label: 'PHOTO STUDIO' }, { id: 'scenemixer', icon: '🧩', label: 'AI POSTER MAKER' }, { id: 'sotoshop', icon: '✨', label: 'SOTOSHOP' }, ];
    
    const renderActiveToolUI = () => { /* ... */ }; 
    const renderResults = () => { /* ... */ }; 

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-content-fade-in">
            <AICreatorInfoBox />
            {/* Implementation of Creative Console, Inputs, and Results */}
        </div>
    );
};

export default AICreator;