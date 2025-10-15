// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, Suspense, useMemo } from 'react';
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
    const [selectedProjectContext, setSelectedProjectContext] = useState<Project | null>(null);

    const completedProjects = useMemo(() => 
        projects.filter(p => 
            p.status === 'completed' && 
            p.project_data.brandInputs &&
            p.project_data.selectedPersona &&
            p.project_data.selectedLogoUrl
        ), [projects]);

    const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projectId = e.target.value;
        if (projectId) {
            const project = completedProjects.find(p => p.id.toString() === projectId);
            setSelectedProjectContext(project || null);
        } else {
            setSelectedProjectContext(null);
        }
    };

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
        const props = { selectedProjectContext };
        switch(activeTool) {
            case 'video': return <Suspense fallback={fallback}><VideoGenerator projects={projects} {...props} /></Suspense>;
            case 'photo': return <Suspense fallback={fallback}><PhotoStudio {...props} /></Suspense>;
            case 'mixer': return <Suspense fallback={fallback}><SceneMixer {...props} /></Suspense>;
            case 'moodboard': return <Suspense fallback={fallback}><MoodboardGenerator {...props} /></Suspense>;
            case 'pattern': return <Suspense fallback={fallback}><PatternGenerator projects={projects} {...props} /></Suspense>;
            case 'mascot': return <Suspense fallback={fallback}><MascotGenerator {...props} /></Suspense>;
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
            <main className="w-full md:w-2/3 lg:w-3/4 bg-surface border border-border-main rounded-xl shadow-lg shadow-black/20 p-6 space-y-6">
                 <div>
                    <label htmlFor="brand-context-selector" className="block text-sm font-bold text-text-header mb-2">Pilih Konteks Brand</label>
                    <select 
                        id="brand-context-selector"
                        onChange={handleContextChange}
                        value={selectedProjectContext?.id || ''}
                        className="w-full bg-background border border-border-main rounded-lg p-2 text-sm text-text-body focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="">🎨 Mode Freestyle (Tanpa Konteks)</option>
                        {completedProjects.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.project_data.brandInputs?.businessName}
                            </option>
                        ))}
                    </select>
                    {selectedProjectContext && (
                        <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3 animate-content-fade-in">
                            <img src={selectedProjectContext.project_data.selectedLogoUrl} alt="logo" className="w-8 h-8 rounded-md bg-white p-1" />
                            <div>
                                <p className="text-xs text-primary font-semibold">Konteks Aktif:</p>
                                <p className="text-sm font-bold text-text-header">{selectedProjectContext.project_data.brandInputs?.businessName}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-border-main pt-6">
                    {renderActiveTool()}
                </div>
            </main>
        </div>
    );
};

export default AICreator;