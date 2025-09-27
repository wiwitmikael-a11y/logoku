
import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd'; // Import komponen iklan baru

type AppState = 'persona' | 'logo' | 'logo_detail' | 'content' | 'social_kit' | 'profile_optimizer' | 'social_ads' | 'packaging' | 'print_media' | 'caption' | 'summary';

const workflowSteps: { id: AppState; name: string }[] = [
    { id: 'persona', name: '1. Brand Persona' },
    { id: 'logo', name: '2. Desain Logo' },
    { id: 'logo_detail', name: '3. Finalisasi Logo' },
    { id: 'content', name: '4. Kalender Konten' },
    { id: 'social_kit', name: '5. Social Media Kit' },
    { id: 'profile_optimizer', name: '6. Optimasi Profil' },
    { id: 'social_ads', name: '7. Teks Iklan' },
    { id: 'packaging', name: '8. Desain Kemasan' },
    { id: 'print_media', name: '9. Media Cetak' },
    { id: 'caption', name: 'Tools: Caption Generator' },
    { id: 'summary', name: 'Lihat Ringkasan' },
];

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: () => void;
  onSelectProject: (projectId: number) => void;
  onContinueProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onSyncProject: (projectId: number) => void;
  syncingProjectId: number | null;
  showWelcomeBanner: boolean;
  onWelcomeBannerClose: () => void;
  onJumpToStep: (projectId: number, step: AppState) => void;
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

const ProjectCardMenu: React.FC<{ project: Project; onJumpToStep: (projectId: number, step: AppState) => void }> = ({ project, onJumpToStep }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectStep = (step: AppState) => {
        onJumpToStep(project.id, step);
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} className="absolute top-3 right-3 z-10">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
                title="Konfigurasi Project"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20 animate-content-fade-in" style={{ animationDuration: '0.2s'}}>
                    {workflowSteps.map(step => (
                        <button
                            key={step.id}
                            onClick={(e) => { e.stopPropagation(); handleSelectStep(step.id); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                            {step.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, onContinueProject, onDeleteProject, onSyncProject, syncingProjectId, showWelcomeBanner, onWelcomeBannerClose, onJumpToStep }) => {
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || 'Bro';

  const { inProgressProjects, localCompleteProjects, completedProjects } = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'in-progress');
    const localComplete = projects.filter(p => p.status === 'local-complete');
    const completed = projects.filter(p => p.status === 'completed');
    return { inProgressProjects: inProgress, localCompleteProjects: localComplete, completedProjects: completed };
  }, [projects]);

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
          <p className="text-sm text-gray-300">Selama masa ini, semua fitur `logo.ku` 100% gratis, hanya dibatasi jatah token harian. Manfaatin buat eksplorasi sepuasnya ya, Juragan!</p>
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
                    title={project.project_data.brandInputs?.businessName || 'Project Tanpa Nama'}
                    onClick={() => onContinueProject(project.id)}
                    >
                    <p className="text-sm text-gray-400 min-h-[40px]">
                        {project.project_data.selectedSlogan ? `"${project.project_data.selectedSlogan}"` : 'Lanjutkan untuk membuat slogan...'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <p className="text-xs text-gray-500">Progres tersimpan...</p>
                        <Button onClick={(e) => { e.stopPropagation(); onContinueProject(project.id); }} variant="secondary" size="small">Lanjutkan</Button>
                    </div>
                    </Card>
                     <ProjectCardMenu project={project} onJumpToStep={onJumpToStep} />
                     <button
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                        className="absolute bottom-3 left-3 p-1.5 rounded-full text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors z-10 opacity-0 group-hover:opacity-100"
                        title="Hapus Project"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
          </div>
        </div>
      )}

      {localCompleteProjects.length > 0 && (
        <div className="w-full text-left mt-8">
            <h3 className="text-lg md:text-xl font-bold mb-4">Project Siap Sinkronisasi:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localCompleteProjects.map(project => (
                <div key={project.id} className="relative group">
                <Card 
                    title={project.project_data.brandInputs.businessName}
                >
                    <div className="space-y-3">
                    <p className="text-sm text-indigo-300 italic">"{project.project_data.selectedSlogan}"</p>
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                        <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-10 h-10 rounded-md bg-white p-1" loading="lazy" />
                        <p className="text-sm text-gray-300"><span className="font-semibold text-gray-200">Persona:</span> {project.project_data.selectedPersona.nama_persona}</p>
                    </div>
                    <p className="text-xs text-yellow-400 pt-2 border-t border-gray-700">Tersimpan lokal. Klik untuk menyimpan permanen & asetnya.</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <Button 
                        onClick={(e) => { e.stopPropagation(); onSyncProject(project.id); }} 
                        variant="primary"
                        size="small"
                        isLoading={syncingProjectId === project.id}
                        disabled={syncingProjectId !== null}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        Sinkronkan
                    </Button>
                    </div>
                </Card>
                 <ProjectCardMenu project={project} onJumpToStep={onJumpToStep} />
                 <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="absolute bottom-3 left-3 p-1.5 rounded-full text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Hapus Project"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
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
                    title={project.project_data.brandInputs.businessName}
                    onClick={() => onSelectProject(project.id)}
                    >
                    <div className="space-y-3">
                        <p className="text-sm text-indigo-300 italic">"{project.project_data.selectedSlogan}"</p>
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                        <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-10 h-10 rounded-md bg-white p-1" loading="lazy" />
                        <p className="text-sm text-gray-300"><span className="font-semibold text-gray-200">Persona:</span> {project.project_data.selectedPersona.nama_persona}</p>
                        </div>
                        <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">Selesai pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                        <Button onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }} variant="secondary" size="small">Lihat Brand Kit</Button>
                    </div>
                    </Card>
                    <ProjectCardMenu project={project} onJumpToStep={onJumpToStep} />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                        className="absolute bottom-3 left-3 p-1.5 rounded-full text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors z-10 opacity-0 group-hover:opacity-100"
                        title="Hapus Project"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
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
    </div>
  );
};

export default ProjectDashboard;
