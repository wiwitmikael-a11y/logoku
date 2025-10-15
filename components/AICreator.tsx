// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useUI } from '../contexts/UIContext';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import type { Project } from '../types';

const VideoGenerator = React.lazy(() => import('./VideoGenerator'));
const MoodboardGenerator = React.lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = React.lazy(() => import('./PatternGenerator'));
const MascotGenerator = React.lazy(() => import('./MascotGenerator'));
const PhotoStudio = React.lazy(() => import('./PhotoStudio'));
const SceneMixer = React.lazy(() => import('./SceneMixer'));


const AI_CREATOR_TIPS = [
    { icon: '🎬', title: 'Baru! AI Video Generator!', text: 'Sekarang kamu bisa bikin video pendek dari teks atau gambar. Cukup kasih ide, dan Mang AI akan meraciknya jadi klip video sinematik! Prosesnya butuh beberapa menit, jadi sabar ya.' },
    { icon: '🎨', title: 'Ciptakan Nuansa Brand', text: "Bingung nentuin nuansa visual brand? Coba 'Asisten Vibe Brand'. Dapetin deskripsi, palet warna, dan 4 gambar inspirasi instan." },
    { icon: '🧩', title: 'Gabungkan Imajinasimu!', text: 'Pakai <strong class="text-text-header">Scene Mixer</strong> buat gabungin beberapa gambar jadi satu. Upload gambar-gambarmu, kasih perintah, dan biarkan Mang AI yang menyatukannya!' },
    { icon: '🌀', title: 'Desain Pola Unik!', text: 'Butuh motif buat kemasan atau background? Pakai <strong class="text-text-header">Studio Motif Brand</strong> buat bikin pola seamless yang keren, lengkap dengan pratinjau mockup.'},
    { icon: '📸', title: 'Foto Produk Profesional', text: 'Upload foto produkmu, hapus background-nya, dan biarkan <strong class="text-text-header">Studio Foto Virtual</strong> menempatkannya di berbagai suasana. Gak perlu sewa studio mahal!'},
    { icon: '🐻', title: 'Lahirkan Maskot Brand-mu', text: 'Ciptakan karakter yang mudah diingat untuk brand-mu dengan <strong class="text-text-header">Pabrik Maskot Interaktif</strong>. Cukup deskripsikan, dan Mang AI akan menggambarnya, plus bisa dibuatkan pose tambahan!'},
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
    projects: Project[];
}
type CreatorTool = 'moodboard' | 'pattern' | 'mascot' | 'photostudio' | 'scenemixer' | 'video' | 'sotoshop';

const ToolContainer: React.FC<{ children: React.ReactNode, title: string, description: string }> = ({ children, title, description }) => (
    <div className="animate-content-fade-in space-y-2">
        <p className="text-splash font-bold text-sm">{title.toUpperCase()}:</p>
        <p className="text-white text-sm">{description}</p>
        <div className="pt-2">{children}</div>
    </div>
);

const SotoshopTool: React.FC<{onShowSotoshop: () => void}> = ({onShowSotoshop}) => (
    <ToolContainer
        title="Sotoshop (Image Editor)"
        description="Editor gambar ringan yang powerful. Gunakan untuk memoles logo, menambah teks, atau bahkan membuat desain sederhana dari nol. Fitur unggulannya termasuk background removal dan AI image generation langsung di kanvas."
    >
        <Button onClick={onShowSotoshop} className="w-full" variant="splash">BUKA SOTOSHOP</Button>
    </ToolContainer>
);

const AICreator: React.FC<AICreatorProps> = ({ onShowSotoshop, projects }) => {
    const [activeTool, setActiveTool] = useState<CreatorTool>('video');

    const handleToolChange = (tool: CreatorTool) => {
        playSound('select');
        setActiveTool(tool);
    };

    const toolsConfig = [
        { id: 'video', icon: '🎬', label: 'Video' },
        { id: 'moodboard', icon: '🎨', label: 'Vibe Brand' },
        { id: 'pattern', icon: '🌀', label: 'Motif Brand' },
        { id: 'mascot', icon: '🐻', label: 'Maskot' },
        { id: 'photostudio', icon: '📸', label: 'Foto Produk' },
        { id: 'scenemixer', icon: '🧩', label: 'Scene Mixer' },
        { id: 'sotoshop', icon: '✨', label: 'Sotoshop' },
    ];

    const renderActiveTool = () => {
        const fallback = <div className="min-h-[200px] flex items-center justify-center"><LoadingMessage /></div>;
        switch(activeTool) {
            case 'video': return <Suspense fallback={fallback}><VideoGenerator projects={projects} /></Suspense>;
            case 'moodboard': return <Suspense fallback={fallback}><MoodboardGenerator /></Suspense>;
            case 'pattern': return <Suspense fallback={fallback}><PatternGenerator projects={projects} /></Suspense>;
            case 'mascot': return <Suspense fallback={fallback}><MascotGenerator /></Suspense>;
            case 'photostudio': return <Suspense fallback={fallback}><PhotoStudio /></Suspense>;
            case 'scenemixer': return <Suspense fallback={fallback}><SceneMixer /></Suspense>;
            case 'sotoshop': return <SotoshopTool onShowSotoshop={onShowSotoshop} />;
            default: return null;
        }
    }
    
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-content-fade-in">
            <AICreatorInfoBox />
            <div className="creative-console-wrapper">
                <div className="creative-console">
                    <div className="console-header"><h2 className="console-title">CreAItor</h2></div>
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

export default AICreator;