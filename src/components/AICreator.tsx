// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy, useEffect } from 'react';
import type { Project, ProjectData } from '../types';
import ModuleLoader from './common/ModuleLoader';
import { useUI } from '../contexts/UIContext';

// Lazy load components for better initial load time
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const ProjectSummary = lazy(() => import('./ProjectSummary'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));
const AiPresenter = lazy(() => import('./AiPresenter'));


interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const SotoshopTools: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
    const [initialPhotoPrompt, setInitialPhotoPrompt] = useState<string | null>(null);

    useEffect(() => {
        if(crossComponentPrompt?.targetTool === 'Studio Foto') {
            setInitialPhotoPrompt(crossComponentPrompt.prompt);
            // Clear the prompt after using it
            setCrossComponentPrompt(null);
        }
    }, [crossComponentPrompt, setCrossComponentPrompt]);

    return (
        <div className="space-y-4">
             <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-full"><span className="text-3xl">🧑‍🔬</span></div>
                <div>
                <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Sotoshop: AI Playground</h3>
                <p className="text-sm text-text-body mt-1">Ini adalah lab eksperimenmu. Gunakan berbagai alat AI untuk menciptakan aset visual unik untuk brand-mu. Semua hasil akan otomatis tersimpan di "Lemari Brand".</p>
                </div>
            </div>
            <MascotGenerator project={project} onUpdateProject={onUpdateProject} />
            <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />
            <PatternGenerator project={project} onUpdateProject={onUpdateProject} />
            <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={initialPhotoPrompt} />
            <SceneMixer project={project} onUpdateProject={onUpdateProject} />
            <VideoGenerator project={project} onUpdateProject={onUpdateProject} />
            <AiPresenter project={project} onUpdateProject={onUpdateProject} />
        </div>
    );
};

const AICreator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState('Ringkasan');
  const { crossComponentPrompt } = useUI();
  
  const tabs = [
    'Ringkasan', '1. Persona', '2. Logo', '3. Kit Sosmed', '4. Konten', 'Sotoshop', 'Lemari Brand'
  ];

  // Effect to switch to Sotoshop tab if a cross-component prompt is set
  useEffect(() => {
    if (crossComponentPrompt) {
        setActiveTab('Sotoshop');
    }
  }, [crossComponentPrompt]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Ringkasan': return <ProjectSummary project={project} onUpdateProject={onUpdateProject} />;
      case '1. Persona': return <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveTab('2. Logo')} />;
      case '2. Logo': return <LogoGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveTab('3. Kit Sosmed')} />;
      case '3. Kit Sosmed': return <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveTab('4. Konten')} />;
      case '4. Konten': return <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveTab('Sotoshop')} />;
      case 'Sotoshop': return <SotoshopTools project={project} onUpdateProject={onUpdateProject} />;
      case 'Lemari Brand': return <LemariBrand project={project} onUpdateProject={onUpdateProject} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-2">
                {tabs.map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'hover:bg-surface'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </aside>
        <div className="flex-grow min-w-0">
            <ModuleLoader>
                {renderContent()}
            </ModuleLoader>
        </div>
    </div>
  );
};

export default AICreator;
