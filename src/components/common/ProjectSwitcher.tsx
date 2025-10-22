// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types';
import Spinner from './Spinner';

const ProjectSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(sessionStorage.getItem('desainfun_currentProjectId'));
  const switcherRef = useRef<HTMLDivElement>(null);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('id, project_data(project_name)').order('created_at', { ascending: false });
    if (error) console.error("Error fetching project list:", error);
    else {
        setProjects(data as any[]);
        if (!currentProjectId && data && data.length > 0) {
            // Select the first project if none is selected
            selectProject(data[0].id);
        }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    const handleProjectListUpdate = () => fetchProjects();
    window.addEventListener('projectListUpdated', handleProjectListUpdate);
    return () => window.removeEventListener('projectListUpdated', handleProjectListUpdate);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    sessionStorage.setItem('desainfun_currentProjectId', projectId);
    window.dispatchEvent(new CustomEvent('projectSelected', { detail: { projectId } }));
    setIsOpen(false);
  };

  const createProject = (withVoice = false) => {
    if (withVoice) {
        window.dispatchEvent(new CustomEvent('createNewProjectWithVoice'));
    } else {
        const projectName = prompt('Masukkan nama proyek baru:', `Proyek Baru ${new Date().toLocaleDateString('id-ID')}`);
        if (projectName) {
            window.dispatchEvent(new CustomEvent('createNewProject', { detail: { projectName } }));
        }
    }
    setIsOpen(false);
  };

  const currentProjectName = projects.find(p => p.id === currentProjectId)?.project_data.project_name || 'Pilih Proyek...';

  return (
    <div className="relative" ref={switcherRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-background rounded-lg border border-border-main hover:bg-border-light transition-colors"
      >
        <span className="font-semibold text-text-header truncate">{currentProjectName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-surface rounded-lg shadow-xl z-10 p-2 border border-border-main max-h-64 overflow-y-auto">
          {loading ? <div className="flex justify-center p-2"><Spinner /></div> : (
            <div className="space-y-1">
                {projects.map(p => (
                    <button key={p.id} onClick={() => selectProject(p.id)} className="w-full text-left p-2 rounded-md text-sm hover:bg-primary/10 text-text-body">
                        {p.project_data.project_name}
                    </button>
                ))}
            </div>
          )}
          <div className="border-t border-border-main mt-2 pt-2 space-y-1">
            <button onClick={() => createProject(false)} className="w-full text-left p-2 rounded-md text-sm hover:bg-primary/10 text-primary font-semibold">🚀 Proyek Baru</button>
            <button onClick={() => createProject(true)} className="w-full text-left p-2 rounded-md text-sm hover:bg-accent/10 text-accent font-semibold">🎙️ Mulai dengan Suara</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;