// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData, BrandInputs } from '../types';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import { useUI } from '../contexts/UIContext';
import Header from './common/Sidebar';
import Onboarding from './common/Onboarding';
import ModuleLoader from './common/ModuleLoader';
import VoiceBrandingWizard from './VoiceBrandingWizard';

const ProjectSummary = lazy(() => import('./ProjectSummary'));
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const Sotoshop = lazy(() => import('./Sotoshop'));
const LemariBrand = lazy(() => import('./LemariBrand'));

type Tab = 'Ringkasan' | '1. Persona' | '2. Logo' | '3. Kit Sosmed' | '4. Konten' | 'Sotoshop' | 'Lemari Brand';

const ProjectDashboard: React.FC = () => {
  const { user, isNewUser } = useAuth();
  const { toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Ringkasan');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVoiceWizard, setShowVoiceWizard] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data);
      const lastProjectId = sessionStorage.getItem('desainfun_currentProjectId');
      const projectToLoad = data.find(p => p.id === lastProjectId) || data[0];
      if (projectToLoad) {
        setCurrentProject(projectToLoad);
      } else {
        setCurrentProject(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    if (isNewUser) {
        const timer = setTimeout(() => setShowOnboarding(true), 1000);
        return () => clearTimeout(timer);
    }
  }, [user, isNewUser]);

  const updateProjectData = async (data: Partial<ProjectData>) => {
    if (!currentProject) return;
    const updatedData = { ...currentProject.project_data, ...data };
    setCurrentProject(prev => prev ? { ...prev, project_data: updatedData } : null);
  };
  
  useDebouncedAutosave(currentProject, 2000);

  const createNewProject = async (projectName: string, initialInputs: BrandInputs | null = null) => {
    if (!user) return;
    const newProjectData: ProjectData = {
        project_name: projectName,
        brandInputs: initialInputs,
        slogans: [],
        selectedSlogan: null,
        logoPrompt: null,
        logoOptions: [],
        selectedLogoUrl: null,
        logoVariations: [],
        brandPersonas: [],
        selectedPersona: null,
        socialMediaKit: null,
        socialProfiles: null,
        contentCalendar: null,
        sotoshop_assets: {},
    };
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').insert({ user_id: user.id, project_data: newProjectData }).select().single();
    if (error) {
      console.error("Error creating project:", error);
    } else {
      await fetchProjects();
      setCurrentProject(data);
      sessionStorage.setItem('desainfun_currentProjectId', data.id);
      window.dispatchEvent(new Event('projectListUpdated'));
    }
  };

  useEffect(() => {
    const handleProjectSelect = (event: Event) => {
      const { projectId } = (event as CustomEvent).detail;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        setActiveTab('Ringkasan');
      }
    };
    
    const handleCreateProject = (event: Event) => {
        const { projectName } = (event as CustomEvent).detail;
        createNewProject(projectName);
    };

    const handleCreateProjectWithVoice = () => {
        setShowVoiceWizard(true);
    };

    window.addEventListener('projectSelected', handleProjectSelect);
    window.addEventListener('createNewProject', handleCreateProject);
    window.addEventListener('createNewProjectWithVoice', handleCreateProjectWithVoice);

    return () => {
      window.removeEventListener('projectSelected', handleProjectSelect);
      window.removeEventListener('createNewProject', handleCreateProject);
      window.removeEventListener('createNewProjectWithVoice', handleCreateProjectWithVoice);
    };
  }, [projects]);
  
  const handleTabChange = (tab: Tab) => {
      setActiveTab(tab);
      window.scrollTo(0, 0);
  }

  const renderContent = () => {
    if (!currentProject) {
      return (
        <div className="text-center p-8 bg-background rounded-lg flex flex-col justify-center items-center h-full">
             <span className="text-5xl mb-4">👋</span>
             <h2 className="text-2xl font-bold text-text-header mt-4" data-onboarding-step="1">Selamat Datang, Juragan!</h2>
             <p className="mt-2 text-text-muted max-w-md">Sepertinya Anda belum punya proyek. Silakan buat proyek baru dari tombol di atas untuk memulai petualangan branding Anda!</p>
         </div>
      );
    }
    
    const tabs: {[key in Tab]: React.ReactNode} = {
      'Ringkasan': <ProjectSummary project={currentProject} onUpdateProject={updateProjectData} />,
      '1. Persona': <BrandPersonaGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => handleTabChange('2. Logo')} />,
      '2. Logo': <LogoGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => handleTabChange('3. Kit Sosmed')} />,
      '3. Kit Sosmed': <SocialMediaKitGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => handleTabChange('4. Konten')} />,
      '4. Konten': <ContentCalendarGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => handleTabChange('Sotoshop')} />,
      'Sotoshop': <Sotoshop project={currentProject} onUpdateProject={updateProjectData} />,
      'Lemari Brand': <LemariBrand project={currentProject} />,
    };

    return <ModuleLoader>{tabs[activeTab]}</ModuleLoader>;
  };
  
  const TABS_CONFIG: {name: Tab; icon: string;}[] = [
      { name: 'Ringkasan', icon: '🏠' },
      { name: '1. Persona', icon: '👤' },
      { name: '2. Logo', icon: '🎨' },
      { name: '3. Kit Sosmed', icon: '📱' },
      { name: '4. Konten', icon: '🗓️' },
      { name: 'Sotoshop', icon: '✨' },
      { name: 'Lemari Brand', icon: '📦' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-1/4 xl:w-1/5" data-onboarding-step="2">
            <nav className="sticky top-24 space-y-2">
              {TABS_CONFIG.map(tab => (
                  <button key={tab.name} onClick={() => handleTabChange(tab.name)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.name ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text-body'}`}>
                      <span className="text-xl">{tab.icon}</span>
                      <span>{tab.name}</span>
                  </button>
              ))}
            </nav>
          </aside>
          <div className="lg:w-3/4 xl:w-4/5">
            {loading ? <div className="h-full flex items-center justify-center"><ModuleLoader><div/></ModuleLoader></div> : renderContent()}
          </div>
        </div>
      </main>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />
    </div>
  );
};

export default ProjectDashboard;
