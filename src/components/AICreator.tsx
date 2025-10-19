// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, lazy, useMemo, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import { playSound } from '../services/soundService';
import Button from './common/Button';
import ModuleLoader from './common/ModuleLoader';
import { useUserActions } from '../contexts/UserActionsContext';
import BrandPersonaGenerator from './BrandPersonaGenerator';

// Lazy load generator components
const LogoGenerator = lazy(() => import('./LogoGenerator'));
const SocialMediaKitGenerator = lazy(() => import('./SocialMediaKitGenerator'));
const ContentCalendarGenerator = lazy(() => import('./ContentCalendarGenerator'));
const MoodboardGenerator = lazy(() => import('./MoodboardGenerator'));
const MascotGenerator = lazy(() => import('./MascotGenerator'));
const PatternGenerator = lazy(() => import('./PatternGenerator'));
const PhotoStudio = lazy(() => import('./PhotoStudio'));
const SceneMixer = lazy(() => import('./SceneMixer'));
const LemariBrand = lazy(() => import('./LemariBrand'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SotoshopTools: React.FC<{
    project: Project;
    onUpdateProject: (data: Partial<ProjectData>) => Promise<void>;
}> = ({ project, onUpdateProject }) => {
    const [activeTool, setActiveTool] = useState('Moodboard');

    const tools = [
        { name: 'Moodboard', icon: '🖼️', component: <MoodboardGenerator project={project} onUpdateProject={onUpdateProject} /> },
        { name: 'Maskot', icon: '🐻', component: <MascotGenerator project={project} onUpdateProject={onUpdateProject} /> },
        { name: 'Motif', icon: '🌀', component: <PatternGenerator project={project} onUpdateProject={onUpdateProject} /> },
        { name: 'Foto Produk', icon: '📸', component: <PhotoStudio project={project} onUpdateProject={onUpdateProject} /> },
        { name: 'Scene Mixer', icon: '🧩', component: <SceneMixer project={project} onUpdateProject={onUpdateProject} /> },
    ];
    
    const activeComponent = tools.find(t => t.name === activeTool)?.component;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-background rounded-lg overflow-x-auto">
                 {tools.map(tool => (
                     <button key={tool.name} onClick={() => setActiveTool(tool.name)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTool === tool.name ? 'bg-accent text-white' : 'hover:bg-border-light'}`}>
                        <span>{tool.icon}</span>
                        {tool.name}
                     </button>
                 ))}
            </div>
            <div className="p-4 bg-background rounded-lg border border-border-main">
                {activeComponent}
            </div>
        </div>
    );
};

const AICreator: React.FC<{
    selectedProject: Project | null;
    setSelectedProject: (project: Project | null) => void;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}> = ({ selectedProject, setSelectedProject, projects, setProjects }) => {
    const { user } = useAuth();
    const { lastVoiceConsultationResult } = useUserActions();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [activeTab, setActiveTab] = useState('Persona');

    const tabs = useMemo(() => [
        { name: 'Persona', icon: '👤' },
        { name: 'Logo', icon: '🎨' },
        { name: 'Kit Sosmed', icon: '📱' },
        { name: 'Kalender', icon: '🗓️' },
        { name: 'Video', icon: '🎬' },
        { name: 'Sotoshop', icon: '✨' },
        { name: 'Lemari Brand', icon: '📦' },
    ], []);

    React.useEffect(() => {
        if (lastVoiceConsultationResult && selectedProject) {
            setActiveTab('Persona');
        }
    }, [lastVoiceConsultationResult, selectedProject]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !user) return;
        setIsCreating(true);
        const supabase = getSupabaseClient();
        
        const initialProjectData: ProjectData = {
            brandInputs: { businessName: newProjectName.trim(), industry: '', targetAudience: '', valueProposition: '', competitorAnalysis: null, businessDetail: null },
            brandPersonas: [],
            selectedPersona: null,
            slogans: [],
            selectedSlogan: null,
            logoPrompts: [],
            logoUrls: [],
            selectedLogoUrl: null,
            logoVariations: null,
            socialMediaKit: null,
            socialProfiles: null,
            contentCalendar: null,
            calendarSources: null,
            sotoshop_assets: null
        };

        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: user.id, project_name: newProjectName.trim(), project_data: initialProjectData })
            .select()
            .single();

        if (error) {
            console.error(error);
        } else if (data) {
            const newProjectList = [data, ...projects];
            setProjects(newProjectList);
            setSelectedProject(data);
            setNewProjectName('');
            playSound('success');
        }
        setIsCreating(false);
    };

    const handleUpdateProjectData = async (data: Partial<ProjectData>) => {
        if (!selectedProject) return;
        const supabase = getSupabaseClient();
        const updatedData = { ...selectedProject.project_data, ...data };
        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update({ project_data: updatedData })
            .eq('id', selectedProject.id)
            .select()
            .single();
        
        if (error) {
            console.error(error);
            throw new Error('Gagal menyimpan progres ke database.');
        }

        if (updatedProject) {
            setSelectedProject(updatedProject);
            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        }
    };

    const TabButton: React.FC<{ name: string; icon: string }> = ({ name, icon }) => (
        <button
            onClick={() => { playSound('select'); setActiveTab(name); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200 ${activeTab === name ? 'text-primary border-primary bg-primary/10' : 'text-text-muted border-transparent hover:text-text-header hover:bg-surface'}`}
        >
            <span>{icon}</span> {name}
        </button>
    );

    const renderContent = () => {
        if (!selectedProject) {
            return (
                <div className="text-center p-8 bg-surface rounded-b-lg lg:rounded-r-lg min-h-[400px] flex flex-col justify-center items-center">
                    <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI" className="w-24 h-24 mx-auto mb-4 animate-breathing-ai" style={{imageRendering: 'pixelated'}}/>
                    <h2 className="text-2xl font-bold text-text-header mt-4">Pilih Proyek Dulu, Juragan!</h2>
                    <p className="mt-2 text-text-muted max-w-md">Silakan pilih proyek yang sudah ada dari daftar di atas, atau buat proyek baru untuk memulai petualangan branding-mu.</p>
                </div>
            );
        }
        
        const components: { [key: string]: React.ReactNode } = {
            'Persona': <BrandPersonaGenerator project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Logo': <LogoGenerator project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Kit Sosmed': <SocialMediaKitGenerator project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Kalender': <ContentCalendarGenerator project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Video': <VideoGenerator project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Sotoshop': <SotoshopTools project={selectedProject} onUpdateProject={handleUpdateProjectData} />,
            'Lemari Brand': <LemariBrand project={selectedProject} />
        };
        
        return (
            <div className="bg-surface p-4 sm:p-6 rounded-b-lg lg:rounded-r-lg min-h-[400px]">
                <ModuleLoader>
                    {components[activeTab]}
                </ModuleLoader>
            </div>
        );
    };

    return (
        <div className="bg-background p-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex-grow">
                    <select
                        value={selectedProject?.id || ''}
                        onChange={(e) => {
                            const project = projects.find(p => p.id === e.target.value) || null;
                            setSelectedProject(project);
                        }}
                        className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">-- Pilih Proyek --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Nama Proyek Baru..."
                        className="flex-grow bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={handleCreateProject} isLoading={isCreating} disabled={!newProjectName.trim()}>
                        Buat
                    </Button>
                </div>
            </div>
            
            <div className="border-b border-border-main overflow-x-auto">
                 <div className="flex space-x-2 -mb-px">
                     {tabs.map(tab => <TabButton key={tab.name} name={tab.name} icon={tab.icon} />)}
                 </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default AICreator;
