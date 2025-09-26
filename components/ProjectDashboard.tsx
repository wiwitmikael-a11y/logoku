import React, { useEffect, useState, useMemo } from 'react';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd';

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: () => void;
  onSelectProject: (projectId: number) => void;
  onContinueProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  showWelcomeBanner: boolean;
  onWelcomeBannerClose: () => void;
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


const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, onContinueProject, onDeleteProject, showWelcomeBanner, onWelcomeBannerClose }) => {
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || 'Bro';

  const { inProgressProjects, completedProjects } = useMemo(() => {
    const inProgress = projects.filter(p => p.status !== 'completed');
    const completed = projects.filter(p => p.status === 'completed');
    return { inProgressProjects: inProgress, completedProjects: completed };
  }, [projects]);

  const renderProjectsWithAds = (projectList: Project[], type: 'in-progress' | 'completed') => {
    return projectList.flatMap((project, index) => {
      const projectCard = (
        <div key={project.id} className="relative">
          {type === 'in-progress' ? (
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
          ) : (
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
            </Card>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors z-10"
            title="Hapus Project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
      );
      
      if (index > 0 && index % 2 !== 0) {
        return [projectCard, <InFeedAd key={`ad-${type}-${project.id}`} />];
      }
      return [projectCard];
    });
  };

  return (
    <div className="flex flex-col gap-10 items-center text-center">
      {showWelcomeBanner && <WelcomeBanner userName={userName} onClose={onWelcomeBannerClose} />}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Selamat Datang, {userName}!</h2>
        <p className="text-gray-400 max-w-3xl">Ini adalah studio branding AI lo. Mulai petualangan branding lo dari A sampai Z, atau lanjutin project yang udah ada.</p>
      </div>
      
      <Button onClick={onNewProject}>
        + Bikin Project Branding Baru (A-Z)
      </Button>
      
       <div className="border-t border-gray-700/50 w-full max-w-4xl my-4"></div>

      {inProgressProjects.length > 0 && (
        <div className="w-full text-left">
          <h3 className="text-lg md:text-xl font-bold mb-4">Lanjutkan Project yang Ada:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderProjectsWithAds(inProgressProjects, 'in-progress')}
          </div>
        </div>
      )}

      {completedProjects.length > 0 && (
        <div className="w-full text-left">
          <h3 className="text-lg md:text-xl font-bold mb-4">Lihat Lagi Brand Kit yang Sudah Selesai:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderProjectsWithAds(completedProjects, 'completed')}
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