// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd';
import SaweriaWidget from './common/SaweriaWidget';

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: () => void;
  onSelectProject: (projectId: number) => void;
  showWelcomeBanner: boolean;
  onWelcomeBannerClose: () => void;
  onDeleteProject: (projectId: number) => void;
}

const WelcomeBanner: React.FC<{ userName: string, onClose: () => void }> = ({ userName, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500); 
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`
            bg-indigo-900/50 border border-indigo-700 rounded-lg p-4 mb-8 text-center
            transition-all duration-500 ease-in-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}
        `}>
            <p className="text-indigo-200">Login berhasil! Selamat datang kembali, {userName}.</p>
        </div>
    );
};

const DeleteButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-3 right-12 z-10 p-1.5 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
    title="Hapus Project"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  </button>
);

const EditButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
    title="Lihat & Edit Project"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
  </button>
);

const StatusBadge: React.FC<{ status: Project['status'] }> = ({ status }) => {
    const statusMap = {
        'in-progress': { text: 'Dikerjakan', color: 'bg-yellow-500/20', dotColor: 'bg-yellow-400', textColor: 'text-yellow-300' },
        'completed': { text: 'Selesai', color: 'bg-green-500/20', dotColor: 'bg-green-400', textColor: 'text-green-300' },
    };
    const { text, color, dotColor, textColor } = statusMap[status] || { text: 'Unknown', color: 'bg-gray-500/20', dotColor: 'bg-gray-400', textColor: 'text-gray-300' };
    return (
        <div className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full items-center gap-1.5 ${color} flex-shrink-0`}>
            <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
            <span className={textColor}>{text}</span>
        </div>
    );
};


const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, showWelcomeBanner, onWelcomeBannerClose, onDeleteProject }) => {
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || 'Bro';

  const { inProgressProjects, completedProjects } = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'in-progress');
    const completed = projects.filter(p => p.status === 'completed');
    return { inProgressProjects: inProgress, completedProjects: completed };
  }, [projects]);
  
  const getProgressDescription = (project: Project): string => {
      const data = project.project_data;
      if (!data.selectedPersona) return "Memulai: Persona Brand";
      if (!data.selectedLogoUrl) return "Progres: Desain Logo";
      if (!data.logoVariations) return "Progres: Finalisasi Logo";
      return "Lanjutkan project...";
  }

  return (
    <div className="flex flex-col gap-8 items-center text-center">
      {showWelcomeBanner && <WelcomeBanner userName={userName} onClose={onWelcomeBannerClose} />}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Selamat Datang, {userName}!</h2>
        <p className="text-gray-400 max-w-2xl">Studio branding AI pribadi lo. Mulai project baru untuk membangun identitas brand dari nol, atau lihat dan kelola brand kit yang sudah pernah lo buat.</p>
      </div>
      
      <div className="w-full max-w-2xl bg-gray-800/50 border border-indigo-700/50 rounded-lg p-4 flex items-center gap-4 text-left animate-content-fade-in">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-white">Info Fase Pengenalan</h4>
          <p className="text-sm text-gray-300">Selama masa pengenalan, nikmati bonus sambutan <span className="font-bold text-yellow-300">20 token</span> di hari pertama! Setelah itu, dapatkan <span className="font-bold text-yellow-300">5 token gratis setiap hari</span> untuk terus berkarya. Manfaatin buat eksplorasi sepuasnya ya, Juragan!</p>
        </div>
      </div>
      
      <Button onClick={onNewProject}>
        + Bikin Project Branding Baru
      </Button>

      {inProgressProjects.length > 0 && (
        <div className="w-full text-left mt-8">
          <h3 className="text-lg md:text-xl font-bold mb-4">Project yang Sedang Dikerjakan:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressProjects.map(project => (
                <div key={project.id} className="relative group">
                    <Card 
                      title={
                        <div>
                            <StatusBadge status={project.status} />
                            <span className="block mt-2 truncate pr-2">{project.project_data.brandInputs?.businessName || 'Project Tanpa Nama'}</span>
                        </div>
                      }
                      onClick={() => onSelectProject(project.id)}
                    >
                      <div className="pr-12">
                          <p className="text-sm text-gray-400 min-h-[40px] italic">
                            {getProgressDescription(project)}
                          </p>
                          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                              <p className="text-xs text-gray-500">Klik untuk lanjut...</p>
                          </div>
                      </div>
                    </Card>
                    <DeleteButton onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} />
                </div>
            ))}
          </div>
        </div>
      )}

      {completedProjects.length > 0 && (
        <div className="w-full text-left mt-8">
          <h3 className="text-lg md:text-xl font-bold mb-4">Project Selesai:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map(project => (
                 <div key={project.id} className="relative group">
                    <Card 
                      title={
                        <div>
                            <StatusBadge status={project.status} />
                            <span className="block mt-2 truncate pr-2">{project.project_data.brandInputs.businessName}</span>
                        </div>
                      }
                      onClick={() => onSelectProject(project.id)}
                    >
                      <div className="space-y-3 pr-12">
                          <p className="text-sm text-indigo-300 italic">"{project.project_data.selectedSlogan}"</p>
                          <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                            <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-10 h-10 rounded-md bg-white p-1" loading="lazy" />
                            <p className="text-sm text-gray-300"><span className="font-semibold text-gray-200">Persona:</span> {project.project_data.selectedPersona.nama_persona}</p>
                          </div>
                          <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">Selesai pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </Card>
                    <DeleteButton onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} />
                    <EditButton onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }} />
                </div>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
              <p>Lo belom punya project nih.</p>
              <p>Klik tombol di atas buat bikin brand pertama lo!</p>
          </div>
      )}
      
      {/* --- AD & SUPPORT PLACEMENT --- */}
      <div className="w-full max-w-4xl mt-12 space-y-8">
          <SaweriaWidget />
          <InFeedAd />
      </div>
    </div>
  );
};

export default ProjectDashboard;