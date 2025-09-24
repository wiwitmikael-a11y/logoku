import React, { useEffect, useState } from 'react';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: () => void;
  onSelectProject: (projectId: number) => void;
  onGoToCaptionGenerator: (projectId: number) => void;
  showWelcomeBanner: boolean;
  onWelcomeBannerClose: () => void;
}

const WelcomeBanner: React.FC<{ userName: string, onClose: () => void }> = ({ userName, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            // After animation ends, call the parent close function
            setTimeout(onClose, 500); 
        }, 4000); // Banner visible for 4 seconds

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


const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, onGoToCaptionGenerator, showWelcomeBanner, onWelcomeBannerClose }) => {
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || 'Bro';

  return (
    <div className="flex flex-col gap-8 items-center text-center">
      {showWelcomeBanner && <WelcomeBanner userName={userName} onClose={onWelcomeBannerClose} />}
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Selamat Datang, {userName}!</h2>
        <p className="text-gray-400 max-w-2xl">Studio branding AI pribadi lo. Mulai project baru untuk membangun identitas brand dari nol, atau lihat dan kelola brand kit yang sudah pernah lo buat.</p>
      </div>
      
      <Button onClick={onNewProject}>
        + Bikin Project Branding Baru
      </Button>

      {projects.length > 0 && (
        <div className="w-full text-left mt-8">
          <h3 className="text-xl font-bold mb-4">Project Lo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Card 
                key={project.id} 
                title={project.project_data.brandInputs.businessName}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="space-y-3">
                    <p className="text-sm text-indigo-300 italic">"{project.project_data.selectedSlogan}"</p>
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                      <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-10 h-10 rounded-md bg-white p-1" />
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-gray-200">Persona:</span> {project.project_data.selectedPersona.nama_persona}
                      </p>
                    </div>
                   <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                    Dibuat pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onGoToCaptionGenerator(project.id);
                        }}
                        variant="secondary"
                        size="small"
                    >
                        Buat Caption
                    </Button>
                </div>
              </Card>
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