// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types';
import Spinner from './common/Spinner';
import GlowingArrowButton from './common/GlowingArrowButton';

const ProjectDock: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(sessionStorage.getItem('desainfun_currentProjectId'));

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('id, project_data(project_name)').order('created_at', { ascending: false });
    if (error) console.error("Error fetching project list:", error);
    else setProjects(data as any[]);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchProjects();
    
    const handleProjectListUpdate = () => fetchProjects();
    window.addEventListener('projectListUpdated', handleProjectListUpdate);
    
    // Also listen for selection changes from AICreator to keep sync
    const handleProjectSelectedEvent = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.projectId) setCurrentProjectId(detail.projectId);
    };
    window.addEventListener('projectSelected', handleProjectSelectedEvent);

    return () => {
        window.removeEventListener('projectListUpdated', handleProjectListUpdate);
        window.removeEventListener('projectSelected', handleProjectSelectedEvent);
    };
  }, [user]);

  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    sessionStorage.setItem('desainfun_currentProjectId', projectId);
    window.dispatchEvent(new CustomEvent('projectSelected', { detail: { projectId } }));
  };

  const createProject = () => {
    const projectName = prompt('Masukkan nama proyek baru:', `Proyek Baru ${new Date().toLocaleDateString('id-ID')}`);
    if (projectName) {
      window.dispatchEvent(new CustomEvent('createNewProject', { detail: { projectName } }));
    }
  };
  
  const createProjectWithVoice = () => {
    window.dispatchEvent(new CustomEvent('createNewProjectWithVoice'));
  };

  return (
    <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl z-30 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'}`} data-onboarding-step="1">
      <div className="bg-surface/80 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-x border-border-main">
        <div className="flex justify-center -mt-4">
           <GlowingArrowButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-text-header mb-3 text-center">Manajer Proyek</h3>
          {loading ? <div className="flex justify-center"><Spinner /></div> : (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow h-48 sm:h-auto sm:max-h-48 overflow-y-auto pr-2 space-y-2">
                {projects.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => selectProject(p.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors text-sm font-semibold ${currentProjectId === p.id ? 'bg-primary text-white shadow-md' : 'bg-background hover:bg-border-light text-text-body'}`}
                  >
                    {p.project_data.project_name}
                  </button>
                ))}
              </div>
              <div className="flex-shrink-0 flex flex-col gap-2">
                <button onClick={createProject} className="w-full p-3 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30 transition-colors">🚀 Buat Proyek Baru</button>
                <button onClick={createProjectWithVoice} className="w-full p-3 bg-accent/20 text-accent rounded-lg text-sm font-semibold hover:bg-accent/30 transition-colors">🎙️ Mulai dengan Suara</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDock;
