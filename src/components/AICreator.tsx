// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy, useEffect } from 'react';
import type { Project, ProjectData, BrandInputs } from '../types';
import ModuleLoader from './common/ModuleLoader';
import { useUI } from '../contexts/UIContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
// FIX: Added missing import for the Button component.
import Button from './common/Button';

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

type TabId = 'persona' | 'logo' | 'sosmed' | 'konten' | 'sotoshop' | 'lemari';

const AICreator: React.FC<Props> = ({ project, onUpdateProject, onCreateProject }) => {
  const [activeTab, setActiveTab] = useState<TabId>('persona');
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);
  const { crossComponentPrompt, setCrossComponentPrompt } = useUI();
  const { lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();

  // Reset to first tab when project changes
  useEffect(() => {
    setActiveTab('persona');
  }, [project]);

  const handleNavigate = (tabId: TabId) => {
    playSound('transition');
    setActiveTab(tabId);
    // You might want to scroll to the top of the creator element here
  };

  useEffect(() => {
    if (crossComponentPrompt) {
        handleNavigate('sotoshop');
        // A more robust implementation would scroll to the specific tool
    }
  }, [crossComponentPrompt]);
  
  useEffect(() => {
    if (lastVoiceConsultationResult) {
      const projectName = `Proyek Suara ${new Date().toLocaleDateString('id-ID')}`;
      onCreateProject(projectName, lastVoiceConsultationResult).then(() => {
        setLastVoiceConsultationResult(null); // Clear after use
        handleNavigate('logo'); // Navigate to the next step
      });
    }
  }, [lastVoiceConsultationResult, onCreateProject, setLastVoiceConsultationResult]);

  if (!project) {
    return (
      <div className="text-center p-8 bg-surface rounded-2xl min-h-[400px] flex flex-col justify-center items-center">
        <span className="text-5xl mb-4">🚀</span>
        <h2 className="text-2xl font-bold text-text-header mt-4">Siap Mulai Petualangan Branding?</h2>
        <p className="mt-2 text-text-muted max-w-md">Buat proyek baru dulu di "Proyek Juragan" di atas, atau coba fitur unggulan konsultasi suara dengan Mang AI!</p>
        <Button onClick={() => setShowVoiceWizard(true)} variant="primary" className="mt-4">
            🎙️ Mulai dengan Konsultasi Suara
        </Button>
        {showVoiceWizard && 
            <ModuleLoader>
                <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} />
            </ModuleLoader>
        }
      </div>
    );
  }

  const TABS: { id: TabId; name: string; }[] = [
    { id: 'persona', name: '1. Persona' },
    { id: 'logo', name: '2. Logo' },
    { id: 'sosmed', name: '3. Kit Sosmed' },
    { id: 'konten', name: '4. Kalender Konten' },
    { id: 'sotoshop', name: '✨ Sotoshop' },
    { id: 'lemari', name: '📦 Lemari Brand' },
  ];

  const renderActiveTabContent = () => {
    switch(activeTab) {
      case 'persona':
        return <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleNavigate('logo')} />;
      case 'logo':
        return <LogoGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleNavigate('sosmed')} />;
      case 'sosmed':
        return <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleNavigate('konten')} />;
      case 'konten':
        return <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => handleNavigate('sotoshop')} />;
      case 'sotoshop':
        return (
            <div className="space-y-8">
                <MascotGenerator project={project} onUpdateProject={onUpdateProject} />
                <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} />
                <PatternGenerator project={project} onUpdateProject={onUpdateProject} />
                <PhotoStudio project={project} onUpdateProject={onUpdateProject} initialPrompt={crossComponentPrompt?.targetTool === 'Studio Foto' ? crossComponentPrompt.prompt : null} />
                <SceneMixer project={project} onUpdateProject={onUpdateProject} />
                <VideoGenerator project={project} onUpdateProject={onUpdateProject} />
                <AiPresenter project={project} onUpdateProject={onUpdateProject} />
            </div>
        );
      case 'lemari':
        return <LemariBrand project={project} onUpdateProject={onUpdateProject} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-lg p-6">
        <div className="flex gap-2 mb-6 border-b-2 border-border-main overflow-x-auto">
            {TABS.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => handleNavigate(tab.id)}
                    className={`py-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id ? 'tab-active-splash' : 'text-text-muted hover:text-text-header'}`}
                >
                    {tab.name}
                </button>
            ))}
        </div>
        <ModuleLoader>
          {renderActiveTabContent()}
        </ModuleLoader>
    </div>
  );
};

export default AICreator;