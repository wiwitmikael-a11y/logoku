// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Project, ProjectData } from '../types';
import MascotGenerator from './MascotGenerator';
import MoodboardGenerator from './MoodboardGenerator';
import PatternGenerator from './PatternGenerator';
import PhotoStudio from './PhotoStudio';
import SceneMixer from './SceneMixer';
import AiPresenter from './AiPresenter';
import VideoGenerator from './VideoGenerator';
import { useUI } from '../contexts/UIContext';

interface Props {
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const Sotoshop: React.FC<Props> = ({ project, onUpdateProject }) => {
    const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
    
    // This allows another component (like Content Calendar) to pre-fill the prompt here
    const initialPhotoStudioPrompt = crossComponentPrompt?.targetTool === 'Studio Foto' ? crossComponentPrompt.prompt : null;
    
    // Clear prompt after consuming it to prevent it from being used again on re-render
    React.useEffect(() => {
        if (initialPhotoStudioPrompt) {
            setCrossComponentPrompt(null);
        }
    }, [initialPhotoStudioPrompt, setCrossComponentPrompt]);

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-splash/10 rounded-full"><span className="text-3xl">🎨</span></div>
                <div>
                    <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Sotoshop: AI Playground</h3>
                    <p className="text-sm text-text-body mt-1">Ini adalah studio kreasimu! Gunakan berbagai tool AI canggih di bawah ini untuk membuat aset-aset visual unik untuk brand-mu. Semua hasil akan otomatis tersimpan di "Lemari Brand".</p>
                </div>
            </div>
            <div className="space-y-4">
                {/* The PhotoStudio component is opened by default if a prompt is passed to it */}
                <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={initialPhotoStudioPrompt} />
                <MascotGenerator project={project} onUpdateProject={onUpdateProject} />
                <VideoGenerator project={project} onUpdateProject={onUpdateProject} />
                <AiPresenter project={project} onUpdateProject={onUpdateProject} />
                <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />
                <PatternGenerator project={project} onUpdateProject={onUpdateProject} />
                <SceneMixer project={project} onUpdateProject={onUpdateProject} />
            </div>
        </div>
    );
};

export default Sotoshop;
