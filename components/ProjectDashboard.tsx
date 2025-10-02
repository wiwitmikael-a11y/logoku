// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import type { Project, BrandInputs } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd';
import SaweriaWidget from './common/SaweriaWidget';
import LoadingMessage from './common/LoadingMessage';

const Forum = React.lazy(() => import('./Forum'));

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: (templateData?: Partial<BrandInputs>) => void;
  onSelectProject: (projectId: number) => void;
  showWelcomeBanner: boolean;
  onWelcomeBannerClose: () => void;
  onDeleteProject: (projectId: number) => void;
  onShowBrandGallery: () => void;
}

// Welcome Banner and other sub-components remain unchanged...
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

const PodiumCard: React.FC<{ project: Project; rank: number; delay: number }> = ({ project, rank, delay }) => {
    const { brandInputs, selectedLogoUrl } = project.project_data;
    
    const rankClasses = {
        1: 'row-start-1 md:row-start-auto md:col-start-2 z-10 scale-110 transform',
        2: 'md:mt-12',
        3: 'md:mt-12',
    };
    
    const glowClasses = {
        1: 'shadow-[0_0_20px_theme(colors.yellow.400)] border-yellow-400',
        2: 'shadow-[0_0_15px_theme(colors.slate.400)] border-slate-400',
        3: 'shadow-[0_0_15px_#A0522D] border-[#A0522D]', // Bronze-like color
    }

    return (
        <div 
            className={`flex flex-col items-center gap-2 group transition-transform duration-300 hover:scale-105 ${rankClasses[rank as keyof typeof rankClasses]}`}
            style={{ animation: `gallery-card-appear 0.5s ${delay}s cubic-bezier(0.25, 1, 0.5, 1) forwards`, opacity: 0 }}
        >
            <div className={`relative w-28 h-28 p-2 rounded-xl bg-white/10 backdrop-blur-sm border-2 transition-all duration-300 ${glowClasses[rank as keyof typeof glowClasses]}`}>
                <img src={selectedLogoUrl} alt={`Logo for ${brandInputs.businessName}`} className="max-w-full max-h-full object-contain mx-auto" />
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gray-900 border-2 flex items-center justify-center text-lg font-bold" style={{ borderColor: (glowClasses[rank as keyof typeof glowClasses] || '').split(' ')[1].replace('border-', '') }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
            </div>
            <p className="text-sm font-semibold text-white truncate w-28 text-center">{brandInputs.businessName}</p>
            <p className="text-xs text-orange-400 font-bold">{project.like_count || 0} Menyala 🔥</p>
        </div>
    );
};


const BrandGalleryPreview: React.FC<{ onShowGallery: () => void }> = ({ onShowGallery }) => {
    const [topProjects, setTopProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopProjects = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('id, project_data, like_count')
                .eq('status', 'completed')
                .order('like_count', { ascending: false })
                .limit(3);
            
            if (error) {
                console.error("Failed to fetch top projects:", error);
            } else {
                // Ensure we have a defined order, even if less than 3 projects exist
                const sorted = data.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
                setTopProjects(sorted as Project[]);
            }
            setIsLoading(false);
        };
        fetchTopProjects();
    }, []);
    
    const [first, second, third] = topProjects;
    const podiumProjects = [second, first, third].filter(Boolean); // Center-first order

    return (
        <div className="w-full text-center mt-12">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-white">Podium Juara Pameran Brand 🏆</h3>
            <div 
                className="group relative bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 transition-colors cursor-pointer overflow-hidden"
                onClick={onShowGallery}
                style={{
                    backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(79, 70, 229, 0.3) 0%, transparent 60%)'
                }}
            >
                {isLoading ? (
                    <div className="h-40 flex items-center justify-center"><LoadingMessage /></div>
                ) : topProjects.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center">
                        <p className="text-gray-400 text-lg">Panggung Masih Kosong!</p>
                        <p className="text-gray-500 mt-1">Jadilah yang pertama menyelesaikan project dan rebut podium juara.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-4 items-end min-h-[160px]">
                        {second && <PodiumCard project={second} rank={2} delay={0.2} />}
                        {first && <PodiumCard project={first} rank={1} delay={0} />}
                        {third && <PodiumCard project={third} rank={3} delay={0.4} />}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <p className="font-bold text-white text-lg animate-pulse">Lihat Semua Pameran &rarr;</p>
                </div>
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

interface TemplateCardProps {
  template: {
    name: string;
    description: string;
    imageUrl: string;
    data: Partial<BrandInputs>;
  };
  onClick: (data: Partial<BrandInputs>) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div
      onClick={() => onClick(template.data)}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl cursor-pointer shadow-lg transition-transform duration-300 hover:scale-105"
    >
      <img
        src={template.imageUrl}
        alt={template.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      
      {/* Default Visible Content */}
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <h4 className="text-lg font-bold">{template.name}</h4>
      </div>

      {/* Hover Content */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-black/70 backdrop-blur-sm text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
        <h4 className="text-lg font-bold">{template.name}</h4>
        <p className="text-xs mt-1 mb-3 text-gray-300">{template.description}</p>
        <p className="text-sm font-semibold text-indigo-400">Gunakan Template &rarr;</p>
      </div>
    </div>
  );
};

const ProjectContent: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, onDeleteProject, onShowBrandGallery }) => {
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
        if (!data.socialMediaKit) return "Progres: Social Media Kit";
        if (!data.socialProfiles) return "Progres: Optimasi Profil";
        if (!data.selectedPackagingUrl) return "Progres: Desain Kemasan";
        if (!data.printMediaAssets) return "Progres: Media Cetak";
        if (!data.contentCalendar) return "Progres: Kalender Konten";
        return "Progres: Iklan Sosmed";
    }

    const templates = [
        {
        name: '☕ Coffee Shop Kekinian',
        description: 'Template untuk kedai kopi modern, fokus pada target pasar anak muda dan mahasiswa.',
        imageUrl: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/templates/IMG_3049.jpeg',
        data: { businessName: 'Kedai Kopi [Isi Sendiri]', businessCategory: 'Minuman', businessDetail: 'Kopi susu gula aren dan manual brew', targetAudience: 'Mahasiswa usia 18-25', valueProposition: 'Tempat nongkrong asik dengan kopi berkualitas dan Wi-Fi kencang.', competitors: 'Janji Jiwa, Kopi Kenangan' }
        },
        {
        name: '🌶️ Warung Seblak Viral',
        description: 'Template untuk bisnis seblak pedas yang menyasar target pasar remaja dan Gen Z.',
        imageUrl: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/templates/IMG_3050.jpeg',
        data: { businessName: 'Seblak [Isi Sendiri]', businessCategory: 'Makanan', businessDetail: 'Seblak prasmanan dengan aneka topping pedas level dewa', targetAudience: 'Remaja usia 15-22', valueProposition: 'Seblak paling komplit dan pedasnya nampol, bikin ketagihan.', competitors: 'Seblak Jeletet, Seblak Bloom' }
        },
        {
        name: '👕 Distro Indie',
        description: 'Template untuk brand fashion streetwear dengan desain orisinal dan eksklusif.',
        imageUrl: 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/templates/IMG_3051.jpeg',
        data: { businessName: '[Isi Sendiri] Supply Co.', businessCategory: 'Fashion', businessDetail: 'T-shirt dan streetwear dengan desain grafis original', targetAudience: 'Anak muda usia 17-28', valueProposition: 'Desain eksklusif yang merepresentasikan kultur anak muda, bahan premium.', competitors: 'Erigo, Thanksinsomnia' }
        }
    ];

    return (
        <div className="flex flex-col gap-8 items-center text-center">
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
                    <TemplateCard 
                        key={template.name}
                        template={template}
                        onClick={onNewProject}
                    />
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
            
            <div className="w-full max-w-4xl mt-12 space-y-8">
                <BrandGalleryPreview onShowGallery={onShowBrandGallery} />
                <div className="saweria-elegant-wrapper">
                    <SaweriaWidget />
                </div>
                <InFeedAd />
            </div>
        </div>
    );
};


const ProjectDashboard: React.FC<ProjectDashboardProps> = (props) => {
  const { session } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || 'Bro';
  const [activeTab, setActiveTab] = useState<'projects' | 'forum'>('projects');

  return (
    <div className="flex flex-col gap-8">
      {props.showWelcomeBanner && <WelcomeBanner userName={userName} onClose={props.onWelcomeBannerClose} />}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Selamat Datang, {userName}!</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">Studio branding AI pribadi lo. Mulai project baru, kelola brand kit, atau ngobrol santai bareng juragan lain di forum.</p>
      </div>

      {/* NEW: Tab Navigation */}
      <div className="flex justify-center border-b border-gray-700">
        <button 
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-3 text-sm md:text-base font-semibold transition-colors ${activeTab === 'projects' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
        >
          🚀 Project Saya
        </button>
        <button 
          onClick={() => setActiveTab('forum')}
          className={`px-6 py-3 text-sm md:text-base font-semibold transition-colors ${activeTab === 'forum' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
        >
          ☕ Forum Juragan
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="mt-4">
        {activeTab === 'projects' && <ProjectContent {...props} />}
        {activeTab === 'forum' && (
          <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><LoadingMessage /></div>}>
            <Forum />
          </Suspense>
        )}
      </div>

    </div>
  );
};

export default ProjectDashboard;