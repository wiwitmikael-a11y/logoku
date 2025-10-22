// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  setSelectedProjectById: (projectId: string) => void;
  handleUpdateProjectData: (data: Partial<ProjectData>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setSelectedProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } else {
      setProjects(data);
      if (data.length > 0) {
        // If there's a selected project, try to keep it selected. Otherwise, select the first one.
        const currentSelectedId = selectedProject?.id;
        if (currentSelectedId && data.some(p => p.id === currentSelectedId)) {
            setSelectedProject(data.find(p => p.id === currentSelectedId) || data[0]);
        } else {
            setSelectedProject(data[0]);
        }
      } else {
        setSelectedProject(null);
      }
    }
    setLoading(false);
  }, [user, selectedProject?.id]);

  useEffect(() => {
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setSelectedProjectById = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleUpdateProjectData = useCallback(async (data: Partial<ProjectData>) => {
    if (!selectedProject) return;
    
    const updatedProject = {
      ...selectedProject,
      project_data: {
        ...selectedProject.project_data,
        ...data
      }
    };
    setSelectedProject(updatedProject);
    setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, [selectedProject]);

  const value: ProjectContextType = {
    projects,
    selectedProject,
    loading,
    fetchProjects,
    setSelectedProjectById,
    handleUpdateProjectData,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};