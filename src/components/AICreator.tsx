// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy, useMemo, useCallback } from 'react';
import type { Project, ProjectData } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/soundService';
import ModuleLoader from './common/ModuleLoader';
import Button from './common/Button';
import ErrorMessage from './common/ErrorMessage';
import Input from './common/Input';
import { useUserActions } from '../contexts/UserActionsContext';
import { clearWorkflowState } from '../services/workflowPersistence';

// Lazy load generator modules
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
const LemariBrand = lazy(() => import('./LemariBrand'));

interface Props {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type MainModule = 'persona' | 'logo' | 'kit' | 'content' | 'sotoshop' | 'lemari';
type SotoshopModule = 'mascot' | 'moodboard' | 'pattern' | 'photostudio' | 'scenemixer' | 'video';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AICreator: React.FC<Props> = ({ selectedProject, setSelectedProject, projects, setProjects }) => {
  const { user } = useAuth();
  const [mainModule, setMainModule] = useState<MainModule>('persona');
  const [sotoshopModule, setSotoshopModule] = useState<SotoshopModule>('mascot');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { addXp } = useUserActions();

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;
    setIsCreatingProject(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const initialProjectData: ProjectData = {
        brandInputs: null, brandPersonas: [], selectedPersona: null, slogans: [], selectedSlogan: null,
        logoPrompt: null, 
        logoStyle: null, 
        logoPaletteName: null, 
        logoOptions: [], selectedLogoUrl: null, logoVariations: null,
        socialMediaKit: null, socialProfiles: null,
        sotoshop_assets: { mascots: [], patterns: [], moodboards: [], productPhotos: [], sceneMixes: [], videos: [] }
      };

      const { data, error: insertError } = await supabase.from('projects')
        .insert({ user_id: user.id, project_name: newProjectName, project_data: initialProjectData })
        .select().single();
      
      if (insertError) throw insertError;

      clearWorkflowState();
      setProjects([data, ...projects]);
      setSelectedProject(data);
      setNewProjectName('');
      await addXp(50); // XP for creating a project
      playSound('success');
    } catch (err) {
      setError((err as Error).message);
      playSound('error');
    } finally {
      setIsCreatingProject(false);
    }
  };
  
  const handleSelectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      clearWorkflowState();
      setSelectedProject(project);
      playSound('select');
    }
  };

    const handleUpdateProjectData = useCallback(async (dataToUpdate: Partial<ProjectData>) => {
        if (!selectedProject) return;
        const supabase = getSupabaseClient();
        const updatedData = { ...selectedProject.project_data, ...dataToUpdate };
        
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({ project_data: updatedData })
            .eq('id', selectedProject.id)
            .select()
            .single();

        if (updateError) throw updateError;
        
        const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        setProjects(updatedProjects);
        setSelectedProject(updatedProject);
    }, [selectedProject, projects, setProjects, setSelectedProject]);

  const mainTabs = useMemo(() => [
    { id: 'persona', label: '1. Persona', icon: '👤' },
    { id: 'logo', label: '2. Logo', icon: '🎨' },
    { id: 'kit', label: '3. Kit Sosmed', icon: '📱' },
    { id: 'content', label: '4. Konten', icon: '🗓️' },
    { id: 'sotoshop', label: 'Sotoshop', icon: '✨' },
    { id: 'lemari', label: 'Lemari Brand', icon: '🗄️' },
  ], []);

  const sotoshopTabs = useMemo(() => [
    { id: 'mascot', label: 'Pabrik Maskot', icon: '🐻' },
    { id: 'moodboard', label: 'Asisten Vibe', icon: '🖼️' },
    { id: 'pattern', label: 'Studio Motif', icon: '🌀' },
    { id: 'photostudio', label: 'Studio Foto', icon: '📸' },
    { id: 'scenemixer', label: 'Scene Mixer', icon: '🎭' },
    { id: 'video', label: 'Studio Video', icon: '🎬' },
  ], []);

  const renderModule = () => {
    if (!selectedProject) {
        return (
            <div className="text-center p-8 bg-background rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-32 h-32 animate-stomp-ai" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-2xl font-bold text-text-header mt-4">Studio AI Siap Beraksi!</h2>
                <p className="mt-2 text-text-muted max-w-md">Pilih proyek yang ada, atau buat yang baru buat mulai petualangan branding-mu, Juragan!</p>
            </div>
        );
    }
    
    const generatorProps = { project: selectedProject, onUpdateProject: handleUpdateProjectData };

    switch (mainModule) {
      case 'persona': return <BrandPersonaGenerator {...generatorProps} />;
      case 'logo': return <LogoGenerator {...generatorProps} />;
      case 'kit': return <SocialMediaKitGenerator />;
      case 'content': return <ContentCalendarGenerator />;
      case 'lemari': return <LemariBrand project={selectedProject} />;
      case 'sotoshop':
          return (
            <div className="p-4 bg-background rounded-lg border border-border-main">
              <div className="flex flex-wrap gap-2 mb-4 border-b border-border-main pb-2">
                {sotoshopTabs.map(tab => (
                  <button key={tab.id} onClick={() => setSotoshopModule(tab.id as SotoshopModule)}
                    className={`flex items-center gap-2 text-sm font-semibold p-2 rounded-md transition-colors ${sotoshopModule === tab.id ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'}`}>
                      <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
              <ModuleLoader>
                { sotoshopModule === 'mascot' && <MascotGenerator {...generatorProps} /> }
                { sotoshopModule === 'moodboard' && <MoodboardGenerator {...generatorProps} /> }
                { sotoshopModule === 'pattern' && <PatternGenerator {...generatorProps} /> }
                { sotoshopModule === 'photostudio' && <PhotoStudio {...generatorProps} /> }
                { sotoshopModule === 'scenemixer' && <SceneMixer {...generatorProps} /> }
                { sotoshopModule === 'video' && <VideoGenerator /> }
              </ModuleLoader>
            </div>
          );
      default: return <ErrorMessage message="Modul tidak ditemukan." />;
    }
  };

  return (
    <div className="space-y-4">
        <div className="p-4 bg-surface rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <select 
                    value={selectedProject?.id || ''} 
                    onChange={e => handleSelectProject(e.target.value)}
                    className="w-full md:w-auto bg-background border border-border-main rounded-md px-3 py-2 text-text-header focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={projects.length === 0}
                    aria-label="Pilih Proyek"
                >
                    <option value="" disabled>{projects.length === 0 ? 'Buat proyek baru dulu!' : 'Pilih Proyek...'}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
                <div className="flex w-full md:w-auto gap-2">
                    <Input 
                        label=""
                        name="newProject"
                        type="text"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder="Nama Proyek Baru..."
                        className="!m-0"
                    />
                    <Button 
                        onClick={handleCreateProject} 
                        isLoading={isCreatingProject}
                        disabled={isCreatingProject || !newProjectName.trim()}
                        className="flex-shrink-0"
                    >
                       + Buat
                    </Button>
                </div>
            </div>
            {error && <ErrorMessage message={error} />}
        </div>
        
        <div className="bg-surface rounded-lg">
            <div className="border-b border-border-main overflow-x-auto">
                <nav className="-mb-px flex space-x-1" aria-label="Tabs">
                    {mainTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMainModule(tab.id as MainModule)}
                            className={`${
                                mainModule === tab.id
                                    ? 'tab-active-splash'
                                    : 'text-text-muted border-transparent hover:text-text-header hover:border-border-light'
                            } flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors`}
                            aria-current={mainModule === tab.id ? 'page' : undefined}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4">
              <ModuleLoader>
                  {renderModule()}
              </ModuleLoader>
            </div>
        </div>
    </div>
  );
};

export default AICreator;