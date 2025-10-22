// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState } from 'react';
import type { Project } from '../types';
import Button from './common/Button';
import GlowingArrowButton from './common/GlowingArrowButton';
import { playSound } from '../services/soundService';
import Newsticker from './common/Newsticker';
import DonationTicker from './common/DonationTicker';

interface Props {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
  onNewVoiceProject: () => void;
}

const ProjectDock: React.FC<Props> = ({ projects, selectedProject, onSelectProject, onDeleteProject, onNewProject, onNewVoiceProject }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playSound('transition');
    setIsOpen(!isOpen);
  }

  return (
    <div className={`sticky bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'}`}>
      <div className="bg-surface/90 backdrop-blur-lg border-t-2 border-primary/20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] rounded-t-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 cursor-pointer" onClick={() => toggleOpen()}>
            <h3 className="text-lg font-bold text-text-header">Garasi Proyek</h3>
            <div className="flex items-center gap-4">
               {selectedProject && <p className="text-sm font-semibold text-accent hidden sm:block">Dipilih: {selectedProject.project_data.project_name}</p>}
               <GlowingArrowButton isOpen={isOpen} onClick={() => toggleOpen()} />
            </div>
          </div>
          <div className="pb-4">
            <div className="mb-3">
              <Newsticker />
              <DonationTicker />
            </div>
            <div className="flex items-stretch gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {projects.map(p => (
                <div 
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); onSelectProject(p); playSound('select'); }}
                  className={`relative flex-shrink-0 w-48 h-28 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${selectedProject?.id === p.id ? 'project-card-active' : 'project-card'}`}
                >
                  <h4 className="font-bold text-sm text-text-header truncate">{p.project_data.project_name}</h4>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all text-xs"
                    title="Hapus Proyek"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4 border-l border-border-main ml-2">
                <Button onClick={onNewProject} size="small">
                  + Proyek Baru
                </Button>
                <Button onClick={onNewVoiceProject} size="small" variant="secondary">
                  🎙️ Suara
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDock;
