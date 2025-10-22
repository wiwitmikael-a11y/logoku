// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, lazy, Suspense } from 'react';
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
import Spinner from './common/Spinner';

// Lazy load components
const BrandPersonaGenerator = lazy(() => import('./BrandPersonaGenerator'));
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const Sotoshop = lazy(() => import('./Sotoshop'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const ProjectSummary = lazy(() => import('./ProjectSummary'));
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const AiPresenter = lazy(() => import('./AiPresenter'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));

interface AICreatorProps {
    activeView: string;
}

const AICreator: React.FC<AICreatorProps> = ({ activeView }) => {
    const { user, isNewUser } = useAuth();
    const { addXp, checkForNewAchievements } = useUserActions();
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showVoiceWizard, setShowVoiceWizard] = useState(false);
    
    // Autosave logic
    const saveFunction = async (data: Partial<ProjectData>) => {
        if (!currentProject) return;
        setIsSaving(true);
        const supabase = getSupabaseClient();
        await supabase.from('projects').update({ project_data: data }).eq('id', currentProject.id);
        setIsSaving(false); // Can be improved with a status indicator
    };
    useDebouncedAutosave(currentProject, saveFunction);
    
    // Fetch projects on mount and when user changes
    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setLoading(true);
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
            
            if (error) { 
                console.error("Error fetching projects:", error); 
            } else {
                const fetchedProjects = data || [];
                setProjects(fetchedProjects);
                if (fetchedProjects.length > 0) {
                    checkForNewAchievements(fetchedProjects.length);
                    const sessionProjectId = sessionStorage.getItem('desainfun_currentProjectId');
                    const projectToLoad = fetchedProjects.find(p => p.id === sessionProjectId) || fetchedProjects[0];
                    setCurrentProject(projectToLoad);
                } else {
                    setCurrentProject(null);
                }
            }
            setLoading(false);
        };
        fetchProjects();
    }, [user, checkForNewAchievements]);

    // Handle events from sidebar/project switcher
    useEffect(() => {
        const handleProjectSelected = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const project = projects.find(p => p.id === detail.projectId);
            if (project) setCurrentProject(project);
        };

        const handleCreateNewProject = async (e: Event) => {
            const detail = (e as CustomEvent).detail;
            await createNewProject(detail.projectName);
        };

        const handleCreateNewProjectWithVoice = () => setShowVoiceWizard(true);

        window.addEventListener('projectSelected', handleProjectSelected);
        window.addEventListener('createNewProject', handleCreateNewProject);
        window.addEventListener('createNewProjectWithVoice', handleCreateNewProjectWithVoice);

        return () => {
            window.removeEventListener('projectSelected', handleProjectSelected);
            window.removeEventListener('createNewProject', handleCreateNewProject);
            window.removeEventListener('createNewProjectWithVoice', handleCreateNewProjectWithVoice);
        };
    }, [projects]); // Re-add listeners if projects list changes

    const createNewProject = async (projectName: string, initialInputs: ProjectData['brandInputs'] = null) => {
        if (!user) return;
        setIsSaving(true);
        const supabase = getSupabaseClient();
        const newProjectData: ProjectData = {
            project_name: projectName, brandInputs: initialInputs,
            slogans: [], selectedSlogan: null, logoPrompt: null, logoOptions: [], selectedLogoUrl: null, logoVariations: [],
            brandPersonas: [], selectedPersona: null, socialMediaKit: null, socialProfiles: null, contentCalendar: null,
            sotoshop_assets: { mascots: [], moodboards: [], patterns: [], photoStudio: [], sceneMixes: [], videos: [], aiPresenter: [] }
        };

        const { data, error } = await supabase.from('projects').insert({ user_id: user.id, project_data: newProjectData }).select().single();
        
        if (error) {
            console.error("Error creating project:", error);
        } else {
            const newProject = data as Project;
            await addXp(50);
            playSound('success');
            // Notify switcher to update
            window.dispatchEvent(new CustomEvent('projectListUpdated'));
            // Automatically select the new project
            window.dispatchEvent(new CustomEvent('projectSelected', { detail: { projectId: newProject.id } }));
        }
        setIsSaving(false);
    };

    const updateProjectData = async (data: Partial<ProjectData>) => {
        if (!currentProject) return;
        const updatedProjectData = { ...currentProject.project_data, ...data };
        const updatedProject = { ...currentProject, project_data: updatedProjectData };
        setCurrentProject(updatedProject);
        // Also update the list to keep it in sync for autosave
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    };
    
    const renderActiveView = () => {
        if (!currentProject) return null;
        
        const props = {
            project: currentProject,
            onUpdateProject: updateProjectData,
        };

        switch(activeView) {
            case 'Ringkasan': return <ProjectSummary {...props} />;
            case '1. Persona': return <BrandPersonaGenerator {...props} onComplete={() => {}} />;
            case '2. Logo': return <LogoGenerator {...props} onComplete={() => {}} />;
            case '3. Kit Sosmed': return <SocialMediaKitGenerator {...props} onComplete={() => {}} />;
            case '4. Konten': return <ContentCalendarGenerator {...props} onComplete={() => {}} />;
            case 'Sotoshop':
            case 'Desainer Maskot':
            case 'Studio Video':
            case 'AI Presenter':
            case 'Asisten Vibe':
            case 'Studio Motif':
            case 'Scene Mixer':
            case 'Studio Foto':
                 return (
                     <div className="space-y-4">
                        <MascotGenerator {...props} />
                        <VideoGenerator {...props} />
                        <AiPresenter {...props} />
                        <MoodboardGenerator {...props} />
                        <PatternGenerator {...props} />
                        <PhotoStudio {...props} />
                        <SceneMixer {...props} />
                     </div>
                 );
            case 'Lemari Brand': return <LemariBrand {...props} />;
            default: return <ProjectSummary {...props} />;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    
    if (!currentProject) {
        return (
            <div className="text-center p-8 bg-surface rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <h2 className="text-3xl font-bold">Selamat Datang, Juragan!</h2>
                <p className="mt-2 text-text-muted max-w-lg mx-auto">Sepertinya belum ada proyek. Yuk, buat brand pertamamu atau pilih dari daftar di sidebar!</p>
                {showVoiceWizard && <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ModuleLoader>
                {renderActiveView()}
            </ModuleLoader>
            {showVoiceWizard && <VoiceBrandingWizard show={showVoiceWizard} onClose={() => setShowVoiceWizard(false)} onCreateProject={createNewProject} />}
        </div>
    );
};

export default AICreator;