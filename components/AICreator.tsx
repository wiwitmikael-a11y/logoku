// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, Suspense } from 'react';
import { playSound } from '../services/soundService';
import type { Project } from '../types';
import LoadingMessage from './common/LoadingMessage';

// Lazy load all the individual tool components
const VideoGenerator = React.lazy(() => import('./VideoGenerator'));
const PhotoStudio = React.lazy(() => import('./PhotoStudio'));
const SceneMixer = React.lazy(() => import('./SceneMixer'));
const MoodboardGenerator = React.lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = React.lazy(() => import('./PatternGenerator'));
const MascotGenerator = React.lazy(() => import('./MascotGenerator'));
const Sotoshop = React.lazy(() => import('./Sotoshop'));

type Tool = 'video' | 'photo' | 'mixer' | 'moodboard' | 'pattern' | 'mascot';

interface AICreatorProps {
  projects: Project[];
}

const AICreator: React.FC<AICreatorProps> = ({ projects }) => {
    const [activeTool, setActiveTool] = useState<Tool>('video');

    const toolsConfig = [
        { id: 'video', name: 'AI Video Generator', desc: 'Ubah ide jadi video pendek sinematik.', icon: '🎬' },
        { id: 'photo', name: 'Studio Foto Virtual', desc: 'Upload produk & tempatkan di berbagai scene.', icon: '📸' },
        { id: 'mixer', name: 'Scene Mixer', desc: 'Gabungkan beberapa gambar jadi satu karya baru.', icon: '🧩' },
        { id: 'moodboard', name: 'Asisten Vibe Brand', desc: 'Tentukan nuansa & palet warna brand-mu.', icon: '🎨' },
        { id: 'pattern', name: 'Studio Motif Brand', desc: 'Buat pola seamless untuk kemasan & lainnya.', icon: '🌀' },
        { id: 'mascot', name: 'Pabrik Maskot Interaktif', desc: 'Lahirkan karakter unik untuk brand-mu.', icon: '🐻' },
    ];

    const renderActiveTool = () => {
        const fallback = <div className="flex justify-center items-center h-64"><LoadingMessage /></div>;
        switch(activeTool) {
            case 'video': return <Suspense fallback={fallback}><VideoGenerator projects={projects} /></Suspense>;
            case 'photo': return <Suspense fallback={fallback}><PhotoStudio /></Suspense>;
            case 'mixer': return <Suspense fallback={fallback}><SceneMixer /></Suspense>;
            case 'moodboard': return <Suspense fallback={fallback}><MoodboardGenerator /></Suspense>;
            case 'pattern': return <Suspense fallback={fallback}><PatternGenerator projects={projects} /></Suspense>;
            case 'mascot': return <Suspense fallback={fallback}><MascotGenerator /></Suspense>;
            default: return null;
        }
    }
    
    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left Navigation */}
            <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                <div className="sticky top-28 space-y-3">
                    <h2 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Creative Studio</h2>
                    {toolsConfig.map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => { playSound('select'); setActiveTool(tool.id as Tool); }}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${activeTool === tool.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-surface border-border-main hover:border-splash/50 hover:bg-background'}`}
                        >
                           <div className="flex items-start gap-4">
                                <div className="text-2xl mt-1">{tool.icon}</div>
                                <div>
                                    <h3 className={`font-bold ${activeTool === tool.id ? 'text-primary' : 'text-text-header'}`}>{tool.name}</h3>
                                    <p className="text-xs text-text-muted">{tool.desc}</p>
                                </div>
                           </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Right Content Area */}
            <main className="w-full md:w-2/3 lg:w-3/4 bg-surface border border-border-main rounded-xl shadow-lg shadow-black/20 p-6">
                {renderActiveTool()}
            </main>
        </div>
    );
};

export default AICreator;