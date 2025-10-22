// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import { playSound } from '../services/soundService';
import Onboarding from './common/Onboarding';
import ModuleLoader from './common/ModuleLoader';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import VoiceBrandingWizard from './VoiceBrandingWizard';
import Button from './common/Button';

// Lazy load components
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const Sotoshop = lazy(() => import('./Sotoshop'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const ProjectSummary = lazy(() => import('./ProjectSummary'));


const TABS = ["Ringkasan", "1. Persona", "2. Logo", "3. Kit Sosmed", "4. Konten", "Sotoshop", "Lemari Brand"];

const AICreator: React.FC = () => {
    const { user, isNewUser } = useAuth();
    const { addXp, checkForNewAchievements } = useUserActions();
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);

    useDebouncedAutosave(currentProject, (data) => updateProjectData(data, true));

    const fetchProjects = async () => {
        if (!user) return;
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) { console.error("Error fetching projects:", error); } 
        else {
            const fetchedProjects = data || [];
            setProjects(fetchedProjects);
            if(fetchedProjects.length > 0) {
                 checkForNewAchievements(fetchedProjects.length);
                 // On initial load, try to load from session or pick the first project
                const sessionProjectId = sessionStorage.getItem('desainfun_currentProjectId');
                const projectToLoad = fetchedProjects.find(p => p.id === sessionProjectId) || fetchedProjects[0];
                if (projectToLoad) {
                    handleProjectSelect(projectToLoad.id);
                } else {
                    setCurrentProject(null);
                }
            } else {
                 setCurrentProject(null);
            }
        }
        setLoading(false);
    };
    
    // This component communicates with ProjectDock via window events
    useEffect(() => {
      const handleProjectSelected = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if(detail.projectId) handleProjectSelect(detail.projectId);
      };

      const handleCreateNewProject = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if(detail.projectName) createNewProject(detail.projectName);
      };
      
      const handleCreateNewProjectWithVoice = () => {
        setShowVoiceWizard(true);
      };

      window.addEventListener('projectSelected', handleProjectSelected);
      window.addEventListener('createNewProject', handleCreateNewProject);
      window.addEventListener('createNewProjectWithVoice', handleCreateNewProjectWithVoice);

      return () => {
        window.removeEventListener('projectSelected', handleProjectSelected);
        window.removeEventListener('createNewProject', handleCreateNewProject);
        window.removeEventListener('createNewProjectWithVoice', handleCreateNewProjectWithVoice);
      };
    }, [projects]); // Rerun if projects list changes to have the correct closure

    useEffect(() => {
        fetchProjects();
        const shouldShow = isNewUser && !localStorage.getItem('desainfun_onboarding_completed');
        setShowOnboarding(shouldShow);
    }, [user]);

    const handleProjectSelect = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setCurrentProject(project);
            setActiveTab(TABS[0]); // Reset to summary tab
            sessionStorage.setItem('desainfun_currentProjectId', projectId);
        }
    };
    
    const createNewProject = async (projectName: string, initialInputs: ProjectData['brandInputs'] = null) => {
        if (!user) return;
        setIsSaving(true);
        const supabase = getSupabaseClient();
        const newProjectData: ProjectData = {
            project_name: projectName,
            brandInputs: initialInputs,
            slogans: [], selectedSlogan: null,
            logoPrompt: null, logoOptions: [], selectedLogoUrl: null, logoVariations: [],
            brandPersonas: [], selectedPersona: null,
            socialMediaKit: null, socialProfiles: null,
            contentCalendar: null,
            sotoshop_assets: { mascots: [], moodboards: [], patterns: [], photoStudio: [], sceneMixes: [], videos: [], aiPresenter: [] }
        };

        const { data, error } = await supabase.from('projects').insert({ user_id: user.id, project_data: newProjectData }).select().single();
        if (error) { console.error("Error creating project:", error); } 
        else {
            const newProject = data as Project;
            setProjects(prev => [newProject, ...prev]);
            setCurrentProject(newProject);
            sessionStorage.setItem('desainfun_currentProjectId', newProject.id);
            setActiveTab(TABS[1]); // Go to persona tab
            await addXp(50);
            playSound('success');
            // Notify dock to update
            window.dispatchEvent(new CustomEvent('projectListUpdated'));
        }
        setIsSaving(false);
    };

    const updateProjectData = async (data: Partial<ProjectData>, isAutosave = false) => {
        if (!currentProject) return;
        const updatedProjectData = { ...currentProject.project_data, ...data };
        const updatedProject = { ...currentProject, project_data: updatedProjectData };
        
        setCurrentProject(updatedProject);
        // Update the project in the main list as well to keep it in sync
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        
        if (isAutosave) return; // Debounced autosave will handle the DB update

        setIsSaving(true);
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('projects').update({ project_data: updatedProject.project_data }).eq('id', currentProject.id);
        if (error) { console.error("Error updating project:", error); }
        setIsSaving(false);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        playSound('transition');
    };

    if (loading) { return <div className="flex justify-center items-center h-64"><p>Memuat proyek...</p></div>; }
    
    if (!currentProject) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <h2 className="text-3xl font-bold">Selamat Datang, Juragan!</h2>
                <p className="mt-2 text-text-muted max-w-lg mx-auto">Sepertinya belum ada proyek, atau belum ada yang dipilih. Yuk, buat brand pertamamu atau pilih dari daftar di bawah!</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                   <Button onClick={() => createNewProject(`Proyek Baru ${new Date().toLocaleDateString()}`)} isLoading={isSaving} variant="primary" size="large">
                        🚀 Buat Proyek Baru
                    </Button>
                    <Button onClick={() => setShowVoiceWizard(true)} isLoading={isSaving} variant="accent" size="large">
                        🎙️ Mulai dengan Suara
                    </Button>
                </div>
                 {showVoiceWizard && <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />}
            </div>
        );
    }

    return (
        <div className="space-y-6">
             {showOnboarding && <Onboarding onClose={() => { setShowOnboarding(false); localStorage.setItem('desainfun_onboarding_completed', 'true'); }} />}
            
            <div className="w-full">
                <div className="border-b border-border-main mb-6" data-onboarding-step="2">
                    <div className="flex space-x-1 overflow-x-auto pb-px">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`py-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${activeTab === tab ? 'tab-active' : 'text-text-muted hover:text-text-header'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="animate-content-fade-in" data-onboarding-step="3">
                    <ModuleLoader>
                        {activeTab === "Ringkasan" && <ProjectSummary project={currentProject} onUpdateProject={updateProjectData} />}
                        {activeTab === "1. Persona" && <BrandPersonaGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => setActiveTab(TABS[2])} />}
                        {activeTab === "2. Logo" && <LogoGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => setActiveTab(TABS[3])} />}
                        {activeTab === "3. Kit Sosmed" && <SocialMediaKitGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => setActiveTab(TABS[4])} />}
                        {activeTab === "4. Konten" && <ContentCalendarGenerator project={currentProject} onUpdateProject={updateProjectData} onComplete={() => setActiveTab(TABS[5])} />}
                        {activeTab === "Sotoshop" && <Sotoshop project={currentProject} onUpdateProject={updateProjectData} />}
                        {activeTab === "Lemari Brand" && <LemariBrand project={currentProject} onUpdateProject={updateProjectData} />}
                    </ModuleLoader>
                </div>
            </div>
             {showVoiceWizard && <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />}
        </div>
    );
};

export default AICreator;
