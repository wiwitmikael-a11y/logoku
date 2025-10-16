// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import type { Project, ProjectData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { getSupabaseClient } from '../services/supabaseClient';
import Button from './common/Button';
import Card from './common/Card';
import InFeedAd from './common/InFeedAd';
import SaweriaWidget from './common/SaweriaWidget';
import LoadingMessage from './common/LoadingMessage';
import CalloutPopup from './common/CalloutPopup';

const Forum = React.lazy(() => import('./Forum'));
const AICreator = React.lazy(() => import('./AICreator'));
const LemariKreasi = React.lazy(() => import('./LemariKreasi'));
const PusatJuragan = React.lazy(() => import('./gamification/PusatJuragan'));

interface ProjectDashboardProps {
  projects: Project[];
  onNewProject: (templateData?: Partial<ProjectData>) => void;
  onSelectProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  onPreloadNewProject: () => void;
}

const DYNAMIC_INFO_TIPS = [
    { icon: '🎉', title: 'Project Pertama Lebih Hemat!', text: 'Rancang brand pertamamu dan dapatkan <strong class="text-text-header">cashback 1 token</strong> di setiap langkah generator utamanya! Ini cara Mang AI bilang \'selamat datang\' dan bantu lo hemat di awal.' },
    { icon: '🎁', title: 'Bonus Sambutan 20 Token', text: 'Sebagai juragan baru, lo juga langsung dapet bonus sambutan <span class="font-bold text-splash">20 token</span> di hari pertama! Manfaatin buat eksplorasi sepuasnya, ya!' },
    { icon: '☀️', title: 'Jatah Harian Anti Rugi', text: 'Tiap pagi, kalo token lo kurang dari 5, Mang AI bakal <strong class="text-text-header">isi ulang sampe jadi 5</strong>, gratis! Kalo sisa token lo banyak (misal 12), jumlahnya <strong class="text-text-header">nggak akan direset</strong>. Aman!' },
    { icon: '💾', title: 'WAJIB: Amankan Aset Visual!', text: 'Untuk menjaga layanan ini gratis, semua gambar (logo, mockup) <strong class="text-text-header">hanya disimpan sementara</strong> di browser. Setelah project selesai, jangan lupa <span class="font-bold text-splash">unduh semua asetmu</span> lewat Brand Hub!' },
    { icon: '🚀', title: 'Kekuatan Brand Hub', text: 'Project yang udah selesai masuk ke <strong class="text-text-header">Brand Hub</strong>. Dari sana, lo bisa generate ulang teks iklan atau kalender konten kapan aja tanpa ngulang dari nol.' },
];

const DynamicInfoBox: React.FC = () => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => { setCurrentTipIndex(prev => (prev + 1) % DYNAMIC_INFO_TIPS.length); }, 7000);
        return () => clearInterval(interval);
    }, []);

    const currentTip = DYNAMIC_INFO_TIPS[currentTipIndex];

    return (
        <div key={currentTipIndex} className="w-full max-w-3xl bg-surface border border-border-main rounded-lg p-4 flex items-start gap-4 text-left animate-content-fade-in shadow-lg shadow-black/20">
            <div className="flex-shrink-0 text-2xl pt-1">{currentTip.icon}</div>
            <div>
                <h4 className="font-bold text-primary">{currentTip.title}</h4>
                <p className="text-sm text-text-body" dangerouslySetInnerHTML={{ __html: currentTip.text }} />
            </div>
        </div>
    );
};

const PodiumCard: React.FC<{ project: Project; rank: number; delay: number }> = ({ project, rank, delay }) => {
    const { brandInputs, selectedLogoUrl } = project.project_data || {};

    if (!brandInputs?.businessName || !selectedLogoUrl) {
        return null; // Don't render card if essential data is missing
    }
    
    const rankClasses = { 1: 'row-start-1 md:row-start-auto md:col-start-2 z-10 scale-110 transform', 2: 'md:mt-12', 3: 'md:mt-12' };
    const glowClasses = { 1: 'shadow-[0_0_20px_theme(colors.yellow.400)] border-yellow-400', 2: 'shadow-[0_0_15px_theme(colors.slate.400)] border-slate-400', 3: 'shadow-[0_0_15px_#A0522D] border-[#A0522D]' }
    const rankColor = (glowClasses[rank as keyof typeof glowClasses] || '').split(' ')[1].replace('border-', '');

    return (
        <div className={`flex flex-col items-center gap-1 group transition-transform duration-300 hover:scale-105 ${rankClasses[rank as keyof typeof rankClasses]}`} style={{ animation: `item-appear 0.5s ${delay}s cubic-bezier(0.25, 1, 0.5, 1) forwards`, opacity: 0 }}>
            <div className={`relative w-24 h-24 p-2 rounded-xl bg-surface/80 backdrop-blur-sm border-2 transition-all duration-300 ${glowClasses[rank as keyof typeof glowClasses]}`}>
                <img src={selectedLogoUrl} alt={`Logo for ${brandInputs.businessName}`} className="max-w-full max-h-full object-contain mx-auto" />
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-surface border-2 flex items-center justify-center text-lg font-bold" style={{ borderColor: rankColor }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
            </div>
            <p className="text-sm font-semibold text-text-header truncate w-24 text-center">{brandInputs.businessName}</p>
            <p className="text-xs text-splash font-bold">{project.like_count || 0} Menyala 🔥</p>
        </div>
    );
};

const BrandGalleryPreview: React.FC = () => {
    const { toggleBrandGalleryModal } = useUI();
    const [topProjects, setTopProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopProjects = async () => {
            const supabase = getSupabaseClient();
            setIsLoading(true);
            const { data, error } = await supabase.from('projects').select('id, project_data, like_count').eq('status', 'completed').order('like_count', { ascending: false }).limit(3);
            if (error) console.error("Failed to fetch top projects:", error);
            else setTopProjects(data.sort((a, b) => (b.like_count || 0) - (a.like_count || 0)) as Project[]);
            setIsLoading(false);
        };
        fetchTopProjects();
    }, []);
    
    const [first, second, third] = topProjects;

    return (
        <div className="w-full text-center mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Podium Juara Pameran Brand 🏆</h2>
            <div className="group relative bg-surface/80 backdrop-blur-sm border border-border-main rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden shadow-lg shadow-black/20" onClick={() => toggleBrandGalleryModal(true)} style={{ backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(14, 165, 233, 0.05) 0%, transparent 60%)' }}>
                {isLoading ? (<div className="h-40 flex items-center justify-center"><LoadingMessage /></div>) : 
                topProjects.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center">
                        <p className="text-text-body text-lg">Panggung Masih Kosong!</p>
                        <p className="text-text-muted mt-1">Jadilah yang pertama menyelesaikan project dan rebut podium juara.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-4 items-end min-h-[160px]">
                        {second && <PodiumCard project={second} rank={2} delay={0.2} />}
                        {first && <PodiumCard project={first} rank={1} delay={0} />}
                        {third && <PodiumCard project={third} rank={3} delay={0.4} />}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <p className="font-bold text-white text-lg animate-pulse" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}>Lihat Semua Pameran &rarr;</p>
                </div>
            </div>
        </div>
    );
};

const ProjectDashboard: React.FC<ProjectDashboardProps> = (props) => {
  const { projects } = props;
  const { profile } = useAuth();
  const { toggleSotoshop, toggleVoiceWizard } = useUI();
  const userName = profile?.full_name?.split(' ')[0] || 'Juragan';
  const [activeTab, setActiveTab] = useState<'projects' | 'lemari' | 'creator' | 'forum' | 'gamify'>('projects');
  
  useEffect(() => {
    if (sessionStorage.getItem('openForumTab')) {
        setActiveTab('forum');
        sessionStorage.removeItem('openForumTab');
    }
  }, []);

  const tabs = [
    { id: 'projects', name: 'Project', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'creator', name: 'CreAItor', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
    { id: 'lemari', name: 'Lemari', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>},
    { id: 'forum', name: 'Forum', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17z" /></svg> },
    { id: 'gamify', name: 'Gamify', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  ];

  const handleTabClick = (id: string) => {
      setActiveTab(id as any);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-text-header mb-2" style={{ fontFamily: 'var(--font-display)' }}>Halo, {userName}! Siap Jadi Juara?</h2>
        <p className="text-text-muted max-w-3xl mx-auto">
            Ini studio branding pribadimu. Mulai dari <strong className="text-sky-400 font-semibold">Project</strong> baru, 
            asah imajinasi di <strong className="text-yellow-400 font-semibold">CreAItor</strong>,
            simpan aset di <strong className="text-fuchsia-400 font-semibold">Lemari</strong>, 
            ngobrol di <strong className="text-orange-400 font-semibold">Forum</strong>, 
            atau asah jiwa kompetisimu di menu <strong className="text-green-400 font-semibold">Gamify</strong>.
        </p>
      </div>

      <div className="flex justify-center border-b border-border-main overflow-x-auto">
        {tabs.map(tab => (
            <TabButton 
                key={tab.id}
                name={tab.name}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => handleTabClick(tab.id)}
            />
        ))}
      </div>
      
      <div className="mt-4">
        {activeTab === 'projects' && <ProjectContent {...props} />}
        {activeTab === 'creator' && (<Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><LoadingMessage /></div>}><AICreator projects={props.projects} /></Suspense>)}
        {activeTab === 'lemari' && (<Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><LoadingMessage /></div>}><LemariKreasi /></Suspense>)}
        {activeTab === 'forum' && (<Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><LoadingMessage /></div>}><Forum /></Suspense>)}
        {activeTab === 'gamify' && (<Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><LoadingMessage /></div>}><PusatJuragan /></Suspense>)}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
    name: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}> = ({ name, icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${active ? 'tab-active-accent' : 'text-text-muted hover:text-text-header'}`}
    >
        {icon}
        <span>{name}</span>
    </button>
);

const ProjectContent: React.FC<ProjectDashboardProps> = ({ projects, onNewProject, onSelectProject, onDeleteProject, onPreloadNewProject }) => {
    const { profile } = useAuth();
    const { toggleVoiceWizard } = useUI();
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    useEffect(() => {
        if (profile?.total_projects_completed === 0 && projects.length === 0 && !sessionStorage.getItem('onboardingDismissed')) setShowOnboarding(true);
    }, [profile, projects]);

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
    
    return (
        <div className="flex flex-col gap-8 items-center text-center">
            <DynamicInfoBox />
            <div className="relative mt-12 flex flex-col items-center gap-4 w-full max-w-md">
                <div className="w-full relative">
                    <Button onClick={() => onNewProject()} onMouseEnter={onPreloadNewProject} size="large" variant="splash" className="w-full">+ Bikin Project Branding Baru</Button>
                    {showOnboarding && (
                        <div onClick={() => { setShowOnboarding(false); sessionStorage.setItem('onboardingDismissed', 'true'); }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max cursor-pointer animate-bounce">
                            <CalloutPopup>Sokin, Juragan! Klik di sini buat mulai!</CalloutPopup>
                        </div>
                    )}
                </div>
                <div className="text-text-muted font-semibold">ATAU</div>
                <div className="w-full text-center">
                    <Button
                        onClick={() => toggleVoiceWizard(true)}
                        variant="splash"
                        size="large"
                        className="w-full"
                    >
                         <span className="relative flex items-center justify-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Mulai Konsultasi Suara
                         </span>
                    </Button>
                    <p className="text-xs text-text-muted px-4 mt-2">Ngobrol langsung sama Mang AI buat bikin fondasi & logo brand.</p>
                </div>
            </div>

            <div className="w-full border-t border-border-main my-8"></div>

            {inProgressProjects.length > 0 && (
                <div className="w-full text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Project yang Sedang Dikerjakan:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressProjects.map(project => (
                        <div key={project.id} className="relative group">
                            <Card title={<><StatusBadge status={project.status} /><span className="block mt-2 truncate pr-20">{project.project_data.brandInputs?.businessName || 'Project Tanpa Nama'}</span></>} onClick={() => onSelectProject(project.id)}>
                              <div className="pr-12">
                                <p className="text-sm text-text-muted min-h-[40px] italic">{getProgressDescription(project)}</p>
                                <div className="mt-4 pt-4 border-t border-border-main"><p className="text-xs text-text-muted">Klik untuk lanjut...</p></div>
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-header" style={{ fontFamily: 'var(--font-display)' }}>Project Selesai (Brand Hub):</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedProjects.map(project => (
                        <div key={project.id} className="relative group">
                            <Card title={<><StatusBadge status={project.status} /><span className="block mt-2 truncate pr-20">{project.project_data.brandInputs?.businessName}</span></>} onClick={() => onSelectProject(project.id)}>
                              <div className="space-y-3 pr-12">
                                <p className="text-sm text-primary italic">"{project.project_data.selectedSlogan}"</p>
                                <div className="flex items-center gap-4 pt-2 border-t border-border-main">
                                    <img src={project.project_data.selectedLogoUrl} alt="logo" className="w-10 h-10 rounded-md bg-surface p-1 border border-border-light" loading="lazy" />
                                    <p className="text-sm text-text-body"><span className="font-semibold text-text-header">Persona:</span> {project.project_data.selectedPersona?.nama_persona}</p>
                                </div>
                                <p className="text-xs text-text-muted pt-2 border-t border-border-main">Selesai pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </Card>
                            <DeleteButton onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} />
                            <EditButton onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }} />
                        </div>
                    ))}
                </div>
                </div>
            )}

            {projects.length === 0 && (<div className="mt-8 text-center text-text-muted"><p>Lo belom punya project nih. Klik tombol di atas buat bikin brand pertama lo!</p></div>)}
            
            <div className="w-full border-t border-border-main my-8"></div>
            <div className="w-full max-w-4xl space-y-8">
                <BrandGalleryPreview />
            </div>
            <div className="w-full max-w-4xl space-y-8 mt-8">
                <SaweriaWidget />
                <InFeedAd />
            </div>
        </div>
    );
};

const DeleteButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button onClick={onClick} className="absolute top-3 right-12 z-10 p-1.5 rounded-full text-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Hapus Project"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
);

const EditButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button onClick={onClick} className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-text-muted hover:bg-background hover:text-text-body transition-colors" title="Lihat & Edit Project"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
);

const StatusBadge: React.FC<{ status: Project['status'] }> = ({ status }) => {
    const statusMap = {
        'in-progress': { text: 'Dikerjakan', color: 'bg-yellow-400/20', dotColor: 'bg-yellow-400', textColor: 'text-yellow-200' },
        'completed': { text: 'Selesai', color: 'bg-green-400/20', dotColor: 'bg-green-400', textColor: 'text-green-200' },
    };
    const { text, color, dotColor, textColor } = statusMap[status] || { text: 'Unknown', color: 'bg-slate-400/20', dotColor: 'bg-slate-400', textColor: 'text-slate-300' };
    return (
        <div className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full items-center gap-1.5 ${color} flex-shrink-0`}>
            <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
            <span className={textColor}>{text}</span>
        </div>
    );
};

export default ProjectDashboard;