// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for ProjectDashboard.tsx to serve as the main app view.
import React, { useState, useEffect, useCallback, lazy } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Project, ProjectData, BrandInputs } from '../types';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import { useUserActions } from '../contexts/UserActionsContext';
import { playSound } from '../services/soundService';
import Sidebar from './common/Sidebar';
import ModuleLoader from './common/ModuleLoader';
import VoiceBrandingWizard from './VoiceBrandingWizard';

const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const Sotoshop = lazy(() => import('./Sotoshop'));
const LemariBrand = lazy(() => import('./LemariBrand'));

const TABS = ["Persona", "Logo", "Kit Sosmed", "Konten", "Sotoshop", "Lemari Brand"];

const ProjectDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addXp, checkForNewAchievements } = useUserActions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);

  useDebouncedAutosave(currentProject);

  const fetchProjectDetails = useCallback(async (projectId: string) => {
    setLoadingProject(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (error) {
      console.error("Error fetching project details:", error);
      sessionStorage.removeItem('desainfun_currentProjectId');
      setCurrentProject(null);
    } else {
      setCurrentProject(data);
    }
    setLoadingProject(false);
  }, []);

  const handleCreateProject = useCallback(async (projectName: string, initialInputs: BrandInputs | null = null) => {
      if (!user) return;
      const supabase = getSupabaseClient();
      const newProjectData: ProjectData = {
          project_name: projectName,
          brandInputs: initialInputs,
          personas: [],
          selectedPersona: null,
          slogans: [],
          selectedSlogan: null,
          logoPrompt: null,
          logoOptions: [],
          selectedLogoUrl: null,
          socialMediaKit: null,
          socialProfiles: null,
          contentCalendar: null,
          sotoshop_assets: {},
      };
      const { data, error } = await supabase.from('projects').insert({ user_id: user.id, project_data: newProjectData }).select().single();
      if (error) {
          console.error("Error creating project:", error);
      } else if (data) {
          playSound('success');
          await addXp(50);
          window.dispatchEvent(new CustomEvent('projectListUpdated'));
          sessionStorage.setItem('desainfun_currentProjectId', data.id);
          setCurrentProject(data);
          checkForNewAchievements(projects.length + 1);
      }
  }, [user, addXp, checkForNewAchievements, projects.length]);

  useEffect(() => {
    const handleProjectSelected = (event: Event) => {
      const { projectId } = (event as CustomEvent).detail;
      if (projectId) fetchProjectDetails(projectId);
    };
    const handleNewProject = (event: Event) => {
      const { projectName } = (event as CustomEvent).detail;
      handleCreateProject(projectName);
    };
    const handleNewProjectWithVoice = () => setShowVoiceWizard(true);

    window.addEventListener('projectSelected', handleProjectSelected);
    window.addEventListener('createNewProject', handleNewProject);
    window.addEventListener('createNewProjectWithVoice', handleNewProjectWithVoice);
    
    const savedProjectId = sessionStorage.getItem('desainfun_currentProjectId');
    if (savedProjectId) {
      fetchProjectDetails(savedProjectId);
    } else {
      setLoadingProject(false); // No project to load
    }

    return () => {
      window.removeEventListener('projectSelected', handleProjectSelected);
      window.removeEventListener('createNewProject', handleNewProject);
      window.removeEventListener('createNewProjectWithVoice', handleNewProjectWithVoice);
    };
  }, [fetchProjectDetails, handleCreateProject]);
  
  const updateProjectData = async (data: Partial<ProjectData>) => {
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, project_data: { ...prev.project_data, ...data } } : null);
    }
  };

  const renderActiveTab = () => {
    if (loadingProject) return <div className="flex justify-center items-center h-96"><p>Loading project...</p></div>;
    if (!currentProject) {
        return (
            <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <span className="text-5xl mb-4">👋</span>
                <h2 className="text-2xl font-bold text-text-header mt-4">Selamat Datang, Juragan!</h2>
                <p className="mt-2 text-text-muted max-w-md">Pilih proyek yang sudah ada atau buat proyek baru dari panel di atas untuk memulai petualangan branding-mu.</p>
            </div>
        );
    }
    
    const props = { project: currentProject, onUpdateProject: updateProjectData };

    switch (activeTab) {
      case "Persona": return <BrandPersonaGenerator {...props} onComplete={() => setActiveTab("Logo")} />;
      case "Logo": return <LogoGenerator {...props} onComplete={() => setActiveTab("Kit Sosmed")} />;
      case "Kit Sosmed": return <SocialMediaKitGenerator {...props} onComplete={() => setActiveTab("Konten")} />;
      case "Konten": return <ContentCalendarGenerator {...props} onComplete={() => setActiveTab("Sotoshop")} />;
      case "Sotoshop": return <Sotoshop {...props} />;
      case "Lemari Brand": return <LemariBrand {...props} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-body">
      <Sidebar project={currentProject} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface border-b border-border-main p-4">
          <div className="flex items-center justify-center">
             <div className="flex items-center gap-2 border border-border-main rounded-full p-1 bg-background">
                {TABS.map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-border-light'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <ModuleLoader>{renderActiveTab()}</ModuleLoader>
        </main>
      </div>
      <VoiceBrandingWizard 
        show={showVoiceWizard}
        onClose={() => setShowVoiceWizard(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ProjectDashboard;
