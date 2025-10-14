// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    generateMoodboardText,
    generateMoodboardImages,
    generateSceneFromImages,
    generatePattern,
    generateProductPhoto,
    generateMascot,
    // New functions based on user request
    applyPatternToMockup,
    generateMascotPose,
    removeBackground,
} from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { useUI } from '../contexts/UIContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import ImageModal from './common/ImageModal';
import LoadingMessage from './common/LoadingMessage';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const MOODBOARD_COST = 3;
const PATTERN_COST = 2;
const MASCOT_COST = 2;
const PHOTO_STUDIO_COST = 1; // Base cost for scene generation
const AI_POSTER_MAKER_COST = 2;
const BG_REMOVAL_COST = 1;
const POSE_PACK_COST = 2;
const MOCKUP_PREVIEW_COST = 1;
const XP_REWARD = 25;

const AI_CREATOR_TIPS = [
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Moodboard Generator'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🧩', title: 'Gabungkan Imajinasimu!', text: 'Pakai <strong class="text-text-header">AI Poster Maker</strong> buat gabungin beberapa gambar jadi satu. Upload gambar-gambarmu, kasih perintah, dan biarkan Mang AI yang menyatukannya!' },
    { icon: '🌀', title: 'Desain Pola Unik!', text: 'Butuh motif buat kemasan atau background? Pakai <strong class="text-text-header">Pattern Generator</strong> buat bikin pola seamless yang keren, lengkap dengan pratinjau 3D.'},
    { icon: '📸', title: 'Foto Produk Profesional', text: 'Upload foto produkmu, hapus background-nya, dan biarkan <strong class="text-text-header">Photo Studio AI</strong> menempatkannya di berbagai suasana. Gak perlu sewa studio mahal!'},
    { icon: '🐻', title: 'Lahirkan Maskot Brand-mu', text: 'Ciptakan karakter yang mudah diingat untuk brand-mu dengan <strong class="text-text-header">Mascot Generator</strong>. Cukup deskripsikan, dan Mang AI akan menggambarnya, plus bisa dibuatkan pose tambahan!'},
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
type CreatorTool = 'moodboard' | 'pattern' | 'mascot' | 'photostudio' | 'poster' | 'sotoshop';

// --- MAIN COMPONENT ---
const AICreator: React.FC<AICreatorProps> = ({ onShowSotoshop }) => {
    const [activeTool, setActiveTool] = useState<CreatorTool>('moodboard');

    const handleToolChange = (tool: CreatorTool) => {
        playSound('select');
        setActiveTool(tool);
    };

    const toolsConfig = [
        { id: 'moodboard', icon: '🎨', label: 'Moodboard' },
        { id: 'pattern', icon: '🌀', label: 'Pattern' },
        { id: 'mascot', icon: '🐻', label: 'Mascot' },
        { id: 'photostudio', icon: '📸', label: 'Photo Studio' },
        { id: 'poster', icon: '🧩', label: 'AI Poster Maker' },
        { id: 'sotoshop', icon: '✨', label: 'Sotoshop' },
    ];

    const renderActiveTool = () => {
        switch(activeTool) {
            case 'moodboard': return <MoodboardGenerator />;
            case 'pattern': return <PatternGenerator />;
            case 'mascot': return <MascotGenerator />;
            case 'photostudio': return <PhotoStudio />;
            case 'poster': return <AIPosterMaker />;
            case 'sotoshop': return <SotoshopTool onShowSotoshop={onShowSotoshop} />;
            default: return null;
        }
    }
    
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-content-fade-in">
            <AICreatorInfoBox />
            <div className="creative-console-wrapper">
                <div className="creative-console">
                    <div className="console-header"><h2 className="console-title">AI Creator</h2></div>
                    <div className="console-monitor-frame">
                        <div className="crt-screen p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
                            <div className="flex border-b-2 border-splash/50 overflow-x-auto">
                                {toolsConfig.map(tool => (
                                    <button key={tool.id} onClick={() => handleToolChange(tool.id as CreatorTool)} className={`flex items-center gap-1.5 flex-shrink-0 font-mono font-bold py-2 px-3 text-xs sm:text-base transition-colors ${activeTool === tool.id ? 'bg-splash/20 text-splash' : 'text-text-muted hover:bg-splash/10'}`}>
                                        <span>{tool.icon}</span><span>{tool.label.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex-grow space-y-4">
                                {renderActiveTool()}
                            </div>
                        </div>
                    </div>
                    <div className="console-controls">
                        <div className="control-group"><div className="toggle-switch on"><div className="switch-lever"></div></div></div>
                        <div className="control-group"><div className="chunky-button red"></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TOOL IMPLEMENTATIONS ---

const ToolContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="animate-content-fade-in space-y-4">{children}</div>
);

const MoodboardGenerator: React.FC = () => {
    // Hooks and state...
    return <ToolContainer>Moodboard Generator UI here</ToolContainer>;
}
const PatternGenerator: React.FC = () => {
    // Hooks and state...
    return <ToolContainer>Pattern Generator UI here</ToolContainer>;
}
const MascotGenerator: React.FC = () => {
    // Hooks and state...
    return <ToolContainer>Mascot Generator UI here</ToolContainer>;
}
const PhotoStudio: React.FC = () => {
    // Hooks and state...
    return <ToolContainer>Photo Studio UI here</ToolContainer>;
}
const AIPosterMaker: React.FC = () => {
    // Hooks and state...
    return <ToolContainer>AI Poster Maker UI here</ToolContainer>;
}
const SotoshopTool: React.FC<{onShowSotoshop: () => void}> = ({onShowSotoshop}) => {
    return (
        <ToolContainer>
            <p className="text-splash font-bold text-sm">SOTOSHOP (IMAGE EDITOR):</p>
            <p className="text-white text-sm">Editor gambar ringan yang powerful. Gunakan untuk memoles logo, menambah teks, atau bahkan membuat desain sederhana dari nol.</p>
            <p className="text-xs text-text-muted">Fitur unggulannya termasuk background removal dan AI image generation langsung di kanvas.</p>
            <Button onClick={onShowSotoshop} className="w-full" variant="splash">BUKA SOTOSHOP</Button>
        </ToolContainer>
    );
}


export default AICreator;
