// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import type { Project, ProjectData } from '../types';
import { useUI } from '../contexts/UIContext';
import ModuleLoader from './common/ModuleLoader';

// Lazy load components for better initial performance
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));
const AiPresenter = lazy(() => import('./AiPresenter'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const ProjectSummary = lazy(() => import('./ProjectSummary'));


interface Props {
  project: Project;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const TABS = [
  'Ringkasan',
  '1. Persona',
  '2. Logo',
  '3. Kit Sosmed',
  '4. Rencana Konten',
  'Sotoshop',
  'Lemari Brand'
];

const AICreator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState('Ringkasan');
  const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
  
  // Cross-component communication for Sotoshop tools
  useEffect(() => {
    if (crossComponentPrompt) {
      setActiveTab('Sotoshop');
    }
  }, [crossComponentPrompt]);

  const handleStepComplete = (nextStep: string) => {
    setActiveTab(nextStep);
  };

  return (
    <div data-onboarding-step="2" className="bg-surface rounded-2xl shadow-lg min-h-[70vh] flex flex-col">
      <div className="p-4 border-b border-border-main">
        <div className="overflow-x-auto">
          <div className="flex gap-2 border-b-2 border-border-main">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 text-sm font-semibold whitespace-nowrap ${activeTab === tab ? 'tab-active' : 'text-text-muted hover:text-text-header'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 flex-grow">
        <ModuleLoader>
          {activeTab === 'Ringkasan' && <ProjectSummary project={project} onUpdateProject={onUpdateProject} />}
          {activeTab === '1. Persona' && <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleStepComplete('2. Logo')} />}
          {activeTab === '2. Logo' && <LogoGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleStepComplete('3. Kit Sosmed')} />}
          {activeTab === '3. Kit Sosmed' && <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleStepComplete('4. Rencana Konten')} />}
          {activeTab === '4. Rencana Konten' && <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleStepComplete('Sotoshop')} />}
          {activeTab === 'Sotoshop' && (
            <div className="space-y-6" data-onboarding-step="3">
              <div className="p-4 rounded-lg flex items-start gap-4 mang-ai-callout border border-border-main">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-splash/10 rounded-full text-splash text-3xl">🎨</div>
                <div>
                    <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}>Sotoshop: Studio Kreatif AI</h3>
                    <p className="text-sm text-text-body mt-1">Ini playground-nya Juragan! Gunakan aneka tool AI canggih di bawah ini untuk membuat aset visual keren buat brand-mu. Semua hasil karyamu akan otomatis tersimpan di "Lemari Brand".</p>
                </div>
              </div>
              <MascotGenerator project={project} onUpdateProject={onUpdateProject} />
              <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />
              <PatternGenerator project={project} onUpdateProject={onUpdateProject} />
              <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={crossComponentPrompt?.targetTool === 'Studio Foto' ? crossComponentPrompt.prompt : null} />
              <SceneMixer project={project} onUpdateProject={onUpdateProject} />
              <AiPresenter project={project} onUpdateProject={onUpdateProject} />
              <VideoGenerator project={project} onUpdateProject={onUpdateProject} />
            </div>
          )}
          {activeTab === 'Lemari Brand' && <LemariBrand project={project} onUpdateProject={onUpdateProject} />}
        </ModuleLoader>
      </div>
    </div>
  );
};

export default AICreator;
