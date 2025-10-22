// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy } from 'react';
import type { Project, ProjectData } from '../types';
import { useUI } from '../contexts/UIContext';
import ModuleLoader from './common/ModuleLoader';

// Lazy load components for better performance
const ProjectSummary = lazy(() => import('./ProjectSummary'));
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

interface Props {
  project: Project;
  // FIX: Updated prop type to return a Promise to match child component expectations.
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}

const AICreator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState('Ringkasan');
  const { crossComponentPrompt, setCrossComponentPrompt } = useUI();

  // Handle cross-component prompt (e.g., from calendar to photo studio)
  React.useEffect(() => {
    if (crossComponentPrompt) {
      setActiveTab('Sotoshop');
      // The PhotoStudio component itself will pick up the prompt from context.
      // We can clear it after a short delay if needed, but it's okay for it to persist.
    }
  }, [crossComponentPrompt]);
  
  const [activeSotoshopTab, setActiveSotoshopTab] = useState('Lemari');

  const mainTabs = ['Ringkasan', '1. Persona', '2. Logo', '3. Kit Medsos', '4. Konten', 'Sotoshop'];
  const sotoshopTabs = ['Lemari', 'Maskot', 'Vibe', 'Motif', 'Foto', 'Mixer', 'Video', 'Presenter'];

  const renderContent = () => {
    if (activeTab === 'Sotoshop') {
      return (
        <>
            <div className="flex gap-2 mb-4 border-b-2 border-border-main overflow-x-auto">
                {sotoshopTabs.map(tab => (
                    <button key={tab} onClick={() => setActiveSotoshopTab(tab)} className={`py-2 px-3 text-sm font-semibold whitespace-nowrap ${activeSotoshopTab === tab ? 'tab-active-splash' : 'text-text-muted'}`}>{tab}</button>
                ))}
            </div>
            <ModuleLoader>
                {activeSotoshopTab === 'Lemari' && <LemariBrand project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Maskot' && <MascotGenerator project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Vibe' && <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Motif' && <PatternGenerator project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Foto' && <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={crossComponentPrompt?.targetTool === 'Studio Foto' ? crossComponentPrompt.prompt : null} />}
                {activeSotoshopTab === 'Mixer' && <SceneMixer project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Video' && <VideoGenerator project={project} onUpdateProject={onUpdateProject} />}
                {activeSotoshopTab === 'Presenter' && <AiPresenter project={project} onUpdateProject={onUpdateProject} />}
            </ModuleLoader>
        </>
      );
    }
    
    return (
        <ModuleLoader>
            {activeTab === 'Ringkasan' && <ProjectSummary project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === '1. Persona' && <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === '2. Logo' && <LogoGenerator project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === '3. Kit Medsos' && <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === '4. Konten' && <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} />}
        </ModuleLoader>
    );
  };
  
  return (
    <div data-onboarding-step="2">
        <div className="flex gap-2 mb-6 border-b-2 border-border-main overflow-x-auto">
            {mainTabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 text-sm font-semibold whitespace-nowrap ${activeTab === tab ? 'tab-active' : 'text-text-muted'}`}>{tab}</button>
            ))}
        </div>
        <div data-onboarding-step="3">
            {renderContent()}
        </div>
    </div>
  );
};

export default AICreator;