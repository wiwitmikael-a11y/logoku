// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useUserActions } from '../contexts/UserActionsContext';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import type { ProjectData } from '../types';
import DashboardHeader from './DashboardHeader';
import AICreator from './AICreator';
import BrandCreationGate from './BrandCreationGate';
import AuthLoadingScreen from './common/AuthLoadingScreen';
import InfoTicker from './common/InfoTicker';

const ProjectDashboard: React.FC = () => {
    const { projects, selectedProject, loading, createNewProject, updateProject, refreshProjects } = useProject();
    const { addXp, checkForNewAchievements } = useUserActions();

    const handleProjectCreated = async (projectData: ProjectData): Promise<void> => {
        const newProject = await createNewProject(projectData);
        if (newProject) {
            await addXp(500); // Big XP reward for first project
            await refreshProjects(); // Ensure list is up-to-date
            checkForNewAchievements(projects.length + 1);
        }
    };
    
    // Autosave functionality
    const handleUpdateProject = async (data: Partial<ProjectData>) => {
        if (selectedProject) {
            // Create a new object to ensure deep updates are detected by the autosave hook
            const updatedData = { ...selectedProject.project_data, ...data };
            await updateProject(selectedProject.id, updatedData);
        }
    };
    useDebouncedAutosave(selectedProject, handleUpdateProject);

    if (loading) {
        return <AuthLoadingScreen />;
    }

    if (projects.length === 0) {
        return <BrandCreationGate onProjectCreated={handleProjectCreated} />;
    }
    
    if (!selectedProject) {
         return (
             <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                 <h2 className="text-2xl font-bold">Pilih Proyek</h2>
                 <p className="text-text-muted mt-2">Sepertinya tidak ada proyek yang terpilih. Silakan muat ulang halaman.</p>
             </div>
         );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <AICreator
                    key={selectedProject.id}
                    project={selectedProject}
                    onUpdateProject={handleUpdateProject}
                />
            </main>
            <InfoTicker />
        </div>
    );
};

export default ProjectDashboard;
