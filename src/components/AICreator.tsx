// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import type { Project, ProjectData } from '../types';
import { useUI } from '../contexts/UIContext';
import ModuleLoader from './common/ModuleLoader';
import WorkflowStep from './common/WorkflowStep';

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

const AICreator: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [activeStep, setActiveStep] = useState('Ringkasan');
  
  const getStepStatus = (stepName: string): 'completed' | 'active' | 'locked' => {
      const { selectedPersona, selectedLogoUrl, socialMediaKit, contentCalendar } = project.project_data;
      
      switch(stepName) {
        case 'Ringkasan':
            return selectedPersona ? 'completed' : 'active';
        case '1. Persona':
            return selectedPersona ? 'completed' : 'active';
        case '2. Logo':
            if (!selectedPersona) return 'locked';
            return selectedLogoUrl ? 'completed' : 'active';
        case '3. Kit Sosmed':
            if (!selectedLogoUrl) return 'locked';
            return socialMediaKit ? 'completed' : 'active';
        case '4. Rencana Konten':
            if (!selectedLogoUrl) return 'locked';
            return contentCalendar ? 'completed' : 'active';
        default: // Sotoshop and Lemari Brand
            return selectedPersona ? 'active' : 'locked';
      }
  };

  const STEPS = [
    { id: 'Ringkasan', title: 'Ringkasan Proyek', icon: '📝', component: <ProjectSummary project={project} onUpdateProject={onUpdateProject} /> },
    { id: '1. Persona', title: 'Langkah 1: Persona', icon: '👤', component: <BrandPersonaGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveStep('2. Logo')} /> },
    { id: '2. Logo', title: 'Langkah 2: Logo', icon: '🎨', component: <LogoGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveStep('3. Kit Sosmed')} /> },
    { id: '3. Kit Sosmed', title: 'Langkah 3: Kit Sosmed', icon: '📱', component: <SocialMediaKitGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveStep('4. Rencana Konten')} /> },
    { id: '4. Rencana Konten', title: 'Langkah 4: Rencana Konten', icon: '🗓️', component: <ContentCalendarGenerator project={project} onUpdateProject={onUpdateProject} onComplete={() => setActiveStep('Sotoshop')} /> },
  ];

  const SOTOSHOP_TOOLS = [
    { id: 'Mascot', title: 'Desainer Maskot', icon: '👻', component: <MascotGenerator project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'Moodboard', title: 'Asisten Vibe Brand', icon: '🎨', component: <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'Pattern', title: 'Studio Motif', icon: '✨', component: <PatternGenerator project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'PhotoStudio', title: 'Studio Foto AI', icon: '📷', component: <PhotoStudio project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'SceneMixer', title: 'Scene Mixer', icon: '🎬', component: <SceneMixer project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'AiPresenter', title: 'AI Presenter', icon: '🎙️', component: <AiPresenter project={project} onUpdateProject={onUpdateProject} /> },
    { id: 'Video', title: 'Studio Video Veo', icon: '🎥', component: <VideoGenerator project={project} onUpdateProject={onUpdateProject} /> },
  ];

  const OTHER_TOOLS = [
     { id: 'Lemari Brand', title: 'Lemari Aset Brand', icon: '🗄️', component: <LemariBrand project={project} onUpdateProject={onUpdateProject} /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3 space-y-2">
        {STEPS.map(step => (
            <WorkflowStep
                key={step.id}
                title={step.title}
                icon={step.icon}
                status={getStepStatus(step.id)}
                isOpen={activeStep === step.id}
                onClick={() => getStepStatus(step.id) !== 'locked' && setActiveStep(step.id)}
            >
                {/* Content is rendered in the main panel */}
            </WorkflowStep>
        ))}
        <WorkflowStep
          title="Sotoshop: Studio Kreatif"
          icon="✨"
          status={getStepStatus('Sotoshop')}
          isOpen={SOTOSHOP_TOOLS.some(t => t.id === activeStep)}
          onClick={() => getStepStatus('Sotoshop') !== 'locked' && setActiveStep('Mascot')}
        >
          <div className="space-y-1 pl-4 border-l-2 border-border-light ml-4">
             {SOTOSHOP_TOOLS.map(tool => (
               <button key={tool.id} onClick={() => setActiveStep(tool.id)} className={`w-full text-left p-2 rounded-md text-sm flex items-center gap-2 ${activeStep === tool.id ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-surface'}`}>
                  <span>{tool.icon}</span> {tool.title}
               </button>
             ))}
          </div>
        </WorkflowStep>
         {OTHER_TOOLS.map(step => (
            <WorkflowStep
                key={step.id}
                title={step.title}
                icon={step.icon}
                status={getStepStatus(step.id)}
                isOpen={activeStep === step.id}
                onClick={() => getStepStatus(step.id) !== 'locked' && setActiveStep(step.id)}
            >
            </WorkflowStep>
        ))}
      </div>

      <div className="lg:w-2/3">
        <ModuleLoader>
          <div className="bg-surface rounded-2xl shadow-lg min-h-[70vh] p-6">
            {[...STEPS, ...SOTOSHOP_TOOLS, ...OTHER_TOOLS].find(s => s.id === activeStep)?.component}
          </div>
        </ModuleLoader>
      </div>
    </div>
  );
};

export default AICreator;