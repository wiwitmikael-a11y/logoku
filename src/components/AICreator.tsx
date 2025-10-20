// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy, Suspense } from 'react';
import type { Project, ProjectData, BrandInputs } from '../types';
import ModuleLoader from './common/ModuleLoader';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';

const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));
const AiPresenter = lazy(() => import('./AiPresenter'));
const VoiceBrandingWizard = lazy(() => import('./VoiceBrandingWizard'));

interface Props {
  project: Project | null;
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
  onCreateProject: (projectName: string, initialInputs: BrandInputs | null) => Promise<void>;
}

const AICreator: React.FC<Props> = ({ project, onUpdateProject, onCreateProject }) => {
  const [activeTab, setActiveTab] = useState('branding');
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
  const { lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();

  React.useEffect(() => {
    if (crossComponentPrompt) {
        setActiveTab('sotoshop');
        // A more robust implementation would scroll to the specific tool
    }
  }, [crossComponentPrompt]);
  
  React.useEffect(() => {
    if (lastVoiceConsultationResult) {
      const projectName = `Proyek Konsultasi Suara - ${new Date().toLocaleDateString()}`;
      onCreateProject(projectName, lastVoiceConsultationResult).then(() => {
        setLastVoiceConsultationResult(null); // Clear after use
        setActiveTab('branding');
      });
    }
  }, [lastVoiceConsultationResult, onCreateProject, setLastVoiceConsultationResult]);


  if (!project) {
    return (
      <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
        <span className="text-5xl mb-4">🚀</span>
        <h2 className="text-2xl font-bold text-text-header mt-4">Siap Mulai Petualangan Branding?</h2>
        <p className="mt-2 text-text-muted max-w-md">Buat proyek baru dulu di panel "Proyek Juragan" di atas, atau coba konsultasi suara dengan Mang AI!</p>
        <button onClick={() => setShowVoiceWizard(true)} className="mt-4 px-4 py-2 bg-splash text-white rounded-lg hover:bg-splash-hover">
            🎙️ Konsultasi Suara
        </button>
        {showVoiceWizard && 
            <ModuleLoader>
                <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
            </ModuleLoader>
        }
      </div>
    );
  }

  const TABS: { id: string; name: string; content: React.ReactNode }[] = [
    { id: 'branding', name: '🧠 Branding Utama', content: (
        <div className="space-y-8">
            <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} />
            <LogoGenerator project={project} onUpdateProject={onUpdateProject} />
            <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} />
            <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} />
        </div>
    )},
    { id: 'sotoshop', name: '✨ Sotoshop (AI Playground)', content: (
        <div className="space-y-8">
            <MascotGenerator project={project} onUpdateProject={onUpdateProject} />
            <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />
            <PatternGenerator project={project} onUpdateProject={onUpdateProject} />
            <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={crossComponentPrompt?.targetTool === 'Studio Foto' ? crossComponentPrompt.prompt : null} />
            <SceneMixer project={project} onUpdateProject={onUpdateProject} />
            <VideoGenerator project={project} onUpdateProject={onUpdateProject} />
            <AiPresenter project={project} onUpdateProject={onUpdateProject} />
        </div>
    )},
    { id: 'lemari', name: '📦 Lemari Brand', content: <LemariBrand project={project} onUpdateProject={onUpdateProject} />},
  ];

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-6" data-onboarding-step="2">
        <div className="flex gap-2 mb-6 border-b-2 border-border-main overflow-x-auto" data-onboarding-step="3">
            {TABS.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 text-sm font-semibold whitespace-nowrap ${activeTab === tab.id ? 'tab-active-primary' : 'text-text-muted hover:text-text-header'}`}
                >
                    {tab.name}
                </button>
            ))}
        </div>
        <ModuleLoader>
          {TABS.find(t => t.id === activeTab)?.content}
        </ModuleLoader>
    </div>
  );
};

export default AICreator;
