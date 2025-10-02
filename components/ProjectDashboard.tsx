// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Project, BrandInputs } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd';
import SaweriaWidget from './common/SaweriaWidget';

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: (templateData?: Partial<BrandInputs>) => void;
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

// NEW: Dynamic info box component
const DYNAMIC_INFO_TIPS = [
    {
        icon: '🎁',
        title: 'Bonus Sambutan Gacor!',
        text: 'Sebagai juragan baru, lo langsung dapet bonus sambutan <span class="font-bold text-yellow-300">20 token</span> di hari pertama! Manfaatin buat eksplorasi sepuasnya, ya!'
    },
    {
        icon: '☀️',
        title: 'Amunisi Harian Gratis',
        text: 'Jangan takut kehabisan ide! Setiap hari, Mang AI kasih <span class="font-bold text-yellow-300">5 token gratis</span> buat lo berkarya. Jatahnya di-reset tiap pagi, lho.'
    },
    {
        icon: '💾',
        title: 'PENTING: Unduh Aset Lo!',
        text: 'Aplikasi ini nyimpen gambar di browser lo (biar gratis!). Jangan lupa <strong class="text-white">unduh semua aset visual</strong> (logo, gambar, dll) ke perangkat lo biar aman sentosa.'
    },
    {
        icon: '🚀',
        title: 'Kekuatan Brand Hub',
        text: 'Project yang udah selesai masuk ke <strong class="text-white">Brand Hub</strong>. Dari sana, lo bisa generate ulang teks iklan atau kalender konten kapan aja tanpa ngulang dari nol.'
    },
    {
        icon: '🤖',
        title: 'Tanya Mang AI Aja!',
        text: 'Ada yang bikin bingung? Klik tombol Mang AI yang ngambang di pojok kanan bawah. Dia siap jawab pertanyaan lo soal branding atau fitur aplikasi.'
    },
    {
        icon: '☕',
        title: 'Dukung Mang AI',
        text: 'Suka sama aplikasi ini? Traktir Mang AI kopi di <strong class="text-white">Saweria</strong> biar makin semangat ngembangin fitur-fitur baru yang lebih canggih buat lo!'
    },
];

const DynamicInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prevIndex => (prevIndex + 1) % DYNAMIC_INFO_TIPS.length);
        }, 7000); // Ganti info setiap 7 detik

        return () => clearInterval(interval);
    }, []);

    const currentTip = DYNAMIC_INFO_TIPS[currentTipIndex];

    return (
        <div key={currentTipIndex} className="w-full max-w-2xl bg-gray-800/50 border border-indigo-700/50 rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in info-box-stream">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-white">{currentTip.title}</h4>
                <p className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
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

// FIX: Removed 'local-complete' status which is deprecated and corrected 'completed' text.
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

  // FIX: Removed filtering for 'local-complete' projects to fix type error.
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

  const templates: { name: string; description: string; data: Partial<BrandInputs> }[] = [
    {
      name: '☕ Coffee Shop Kekinian',
      description: 'Template untuk kedai kopi modern, fokus pada target pasar anak muda dan mahasiswa.',
      data: { businessName: 'Kedai Kopi [Isi Sendiri]', businessCategory: 'Minuman', businessDetail: 'Kopi susu gula aren dan manual brew', targetAudience: 'Mahasiswa usia 18-25', valueProposition: 'Tempat nongkrong asik dengan kopi berkualitas dan Wi-Fi kencang.', competitors: 'Janji Jiwa, Kopi Kenangan' }
    },
    {
      name: '🌶️ Warung Seblak Viral',
      description: 'Template untuk bisnis seblak pedas yang menyasar target pasar remaja dan Gen Z.',
      data: { businessName: 'Seblak [Isi Sendiri]', businessCategory: 'Makanan', businessDetail: 'Seblak prasmanan dengan aneka topping pedas level dewa', targetAudience: 'Remaja usia 15-22', valueProposition: 'Seblak paling komplit dan pedasnya nampol, bikin ketagihan.', competitors: 'Seblak Jeletet, Seblak Bloom' }
    },
    {
      name: '👕 Distro Indie',
      description: 'Template untuk brand fashion streetwear dengan desain orisinal dan eksklusif.',
      data: { businessName: '[Isi Sendiri] Supply Co.', businessCategory: 'Fashion', businessDetail: 'T-shirt dan streetwear dengan desain grafis original', targetAudience: 'Anak muda usia 17-28', valueProposition: 'Desain eksklusif yang merepresentasikan kultur anak muda, bahan premium.', competitors: 'Erigo, Thanksinsomnia' }
    }
  ];

  return (
    <div className="flex flex-col gap-8 items-center text-center">
      {showWelcomeBanner && <WelcomeBanner userName={userName} onClose={onWelcomeBannerClose} />}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Selamat Datang, {userName}!</h2>
        <p className="text-gray-400 max-w-2xl">Studio branding AI pribadi lo. Mulai project baru untuk membangun identitas brand dari nol, atau lihat dan kelola brand kit yang sudah pernah lo buat.</p>
      </div>
      
      <DynamicInfoBox />
      
      <Button onClick={() => onNewProject()}>
        + Bikin Project Branding Baru
      </Button>
      
      <div className="w-full text-center mt-6">
        <div className="relative inline-block my-2">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-600"></div>
          <span className="relative bg-gray-900 px-4 text-gray-400 text-sm">Atau pake...</span>
        </div>
        <h3 className="text-lg md:text-xl font-bold mb-4 mt-2">Jalan Pintas Juragan 🚀</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          {templates.map(template => (
            <Card 
              key={template.name}
              title={template.name}
              onClick={() => onNewProject(template.data)}
            >
              <p className="text-sm text-gray-400">{template.description}</p>
            </Card>
          ))}
        </div>
      </div>


      {inProgressProjects.length > 0 && (
        <div className="w-full text-left mt-8">
          <h3 className="text-lg md:text-xl font-bold mb-4">Project yang Sedang Dikerjakan:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressProjects.map(project => (
                <div key={project.id} className="card-in-progress-wrapper">
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
                 <div key={project.id} className="card-completed-wrapper">
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
          <div className="saweria-elegant-wrapper">
            <SaweriaWidget />
          </div>
          <InFeedAd />
      </div>
    </div>
  );
};

export default ProjectDashboard;