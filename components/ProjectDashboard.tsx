// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { clearWorkflowState } from '../services/workflowPersistence';
import type { Project } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import Toast from './common/Toast';
import ConfirmationModal from './common/ConfirmationModal';
import DeleteProjectSliderModal from './common/DeleteProjectSliderModal';
import { generateContentCalendar, generateSocialMediaKitAssets, generateSocialProfiles, generateSocialAds, generatePackagingDesign, generatePrintMedia, generateMerchandiseMockup } from '../services/geminiService';
import { fetchImageAsBase64 } from '../utils/imageUtils';

const ProjectSummary = lazy(() => import('./ProjectSummary'));
const CaptionGenerator = lazy(() => import('./CaptionGenerator'));
const InstantContentGenerator = lazy(() => import('./InstantContentGenerator'));
const SaweriaWidget = lazy(() => import('./common/SaweriaWidget'));
const Forum = lazy(() => import('./Forum'));
const QuickTools = lazy(() => import('./QuickTools'));

interface Props {
  onStartNewProject: () => void;
}

const ProjectDashboard: React.FC<Props> = ({ onStartNewProject }) => {
    const { user, profile, refreshProfile, addXp, deductCredits, setShowOutOfCreditsModal } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [view, setView] = useState<'dashboard' | 'caption_generator' | 'instant_content' | 'forum' | 'quick_tools'>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState({ message: '', show: false });
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showShareConfirm, setShowShareConfirm] = useState(false);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProjects(data as Project[]);
        } catch (err: any) {
            setError(`Gagal memuat project: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProjects();
        refreshProfile();
    }, [fetchProjects, refreshProfile]);
    
    const showToast = (message: string) => setToast({ message, show: true });

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            if (selectedProject?.id === projectToDelete.id) setSelectedProject(null);
            showToast(`Project "${projectToDelete.project_data.brandInputs.businessName}" berhasil dihapus.`);
        } catch (err: any) {
            setError(`Gagal hapus project: ${err.message}`);
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };
    
    // --- All regeneration functions ---
    const handleRegenerateAsset = async (
        cost: number,
        regenFunc: () => Promise<any>,
        updateKey: keyof Project['project_data']
    ) => {
        if (!selectedProject || !profile || profile.credits < cost) {
            setShowOutOfCreditsModal(true);
            return;
        }
        try {
            const newData = await regenFunc();
            const updatedProjectData = { ...selectedProject.project_data, [updateKey]: newData };
            const { data, error } = await supabase
                .from('projects')
                .update({ project_data: updatedProjectData })
                .eq('id', selectedProject.id)
                .select()
                .single();
            if (error) throw error;
            await deductCredits(cost);
            setSelectedProject(data as Project);
            setProjects(prev => prev.map(p => p.id === data.id ? data : p));
            showToast("Aset berhasil di-generate ulang!");
        } catch (err: any) {
            setError(`Gagal generate ulang: ${err.message}`);
        }
    };

    const onRegenerateContentCalendar = () => handleRegenerate(1, () => generateContentCalendar(selectedProject!.project_data.brandInputs.businessName, selectedProject!.project_data.selectedPersona), 'contentCalendar');
    const onRegenerateSocialKit = () => handleRegenerate(2, () => generateSocialMediaKitAssets(selectedProject!.project_data), 'socialMediaKit');
    const onRegenerateProfiles = () => handleRegenerate(1, () => generateSocialProfiles(selectedProject!.project_data.brandInputs, selectedProject!.project_data.selectedPersona), 'socialProfiles');
    const onRegenerateSocialAds = () => handleRegenerate(1, () => generateSocialAds(selectedProject!.project_data.brandInputs, selectedProject!.project_data.selectedPersona, selectedProject!.project_data.selectedSlogan), 'socialAds');
    
    const onRegeneratePackaging = async () => {
        if (!selectedProject) return;
        const prompt = 'Create a photorealistic product mockup for packaging a product called ' + selectedProject.project_data.brandInputs.businessDetail;
        const logoBase64 = await fetchImageAsBase64(selectedProject.project_data.selectedLogoUrl);
        await handleRegenerate(1, async () => (await generatePackagingDesign(prompt, logoBase64))[0], 'selectedPackagingUrl');
    };

    const onRegenerateMerchandise = async () => {
        if (!selectedProject) return;
        const prompt = 'A realistic mockup of a t-shirt with a brand logo.';
        const logoBase64 = await fetchImageAsBase64(selectedProject.project_data.selectedLogoUrl);
        await handleRegenerate(1, async () => (await generateMerchandiseMockup(prompt, logoBase64))[0], 'merchandiseUrl');
    };
    
    const onRegeneratePrintMedia = async (mediaType: 'banner' | 'roll_banner') => {
        // This is a complex one, we just do a simplified regen for now
        showToast("Fitur regenerate media cetak spesifik akan segera hadir!");
    }
    
    const onShareToForum = (project: Project) => {
        if (project.status === 'completed') {
            setShowShareConfirm(true);
        } else {
            showToast("Project harus diselesaikan dulu baru bisa dipamerin.");
        }
    }

    const executeShareToForum = async () => {
        // This is a placeholder. In a real app, this would create a new forum thread.
        setShowShareConfirm(false);
        showToast("Mantap! Project lo udah siap dipamerin di forum. (Fitur segera hadir!)");
    };


    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingMessage /></div>;
    
    if (selectedProject && view === 'dashboard') {
        return (
            <Suspense fallback={<LoadingMessage />}>
                <ProjectSummary
                    project={selectedProject}
                    onStartNew={onStartNewProject}
                    onGoToCaptionGenerator={() => setView('caption_generator')}
                    onGoToInstantContent={() => setView('instant_content')}
                    onDeleteProject={() => setProjectToDelete(selectedProject)}
                    onRegenerateContentCalendar={onRegenerateContentCalendar}
                    onRegenerateSocialKit={onRegenerateSocialKit}
                    onRegenerateProfiles={onRegenerateProfiles}
                    onRegenerateSocialAds={onRegenerateSocialAds}
                    onRegeneratePackaging={onRegeneratePackaging}
                    onRegeneratePrintMedia={onRegeneratePrintMedia}
                    onRegenerateMerchandise={onRegenerateMerchandise}
                    addXp={addXp}
                    onShareToForum={onShareToForum}
                />
                 <Button onClick={() => setSelectedProject(null)} className="mt-8">&larr; Kembali ke Daftar Project</Button>
            </Suspense>
        );
    }
    
    if (view === 'caption_generator' && selectedProject) {
        return <Suspense fallback={<LoadingMessage />}><CaptionGenerator projectData={selectedProject.project_data} onBack={() => setView('dashboard')} onGoToDashboard={() => { setView('dashboard'); setSelectedProject(null); }} addXp={addXp} /></Suspense>;
    }
    
    if (view === 'instant_content' && selectedProject) {
        return <Suspense fallback={<LoadingMessage />}><InstantContentGenerator projectData={selectedProject.project_data} onBack={() => setView('dashboard')} onGoToDashboard={() => { setView('dashboard'); setSelectedProject(null); }} addXp={addXp} /></Suspense>;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Dashboard Juragan</h2>
                <p className="text-text-muted max-w-2xl mx-auto">Selamat datang kembali, {profile?.full_name?.split(' ')[0] || 'Juragan'}! Di sini lo bisa lihat semua project yang udah lo buat, atau mulai racikan brand baru.</p>
            </div>
            
            <div className="flex justify-center">
                <Button onClick={() => { clearWorkflowState(); onStartNewProject(); }} size="large" variant="splash">
                    + Racik Brand Baru
                </Button>
            </div>
            
            {error && <ErrorMessage message={error} />}

            {projects.length === 0 && !isLoading ? (
                <Card title="Belum Ada Project">
                    <p className="text-text-body">Keliatannya lo belum punya project apa-apa. Klik tombol "Racik Brand Baru" di atas buat mulai petualangan branding pertama lo!</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <Card
                            key={project.id}
                            title={project.project_data.brandInputs.businessName}
                            onClick={() => setSelectedProject(project)}
                            className="animate-item-appear"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <img
                                    src={project.project_data.selectedLogoUrl}
                                    alt={`Logo for ${project.project_data.brandInputs.businessName}`}
                                    className="w-16 h-16 object-contain bg-white p-1 rounded-md flex-shrink-0"
                                    loading="lazy"
                                />
                                <div className="text-sm">
                                    <p className="font-semibold text-text-header">{project.project_data.selectedPersona.nama_persona}</p>
                                    <p className="text-text-muted italic">"{project.project_data.selectedSlogan}"</p>
                                    <p className="text-xs text-text-muted mt-2">Dibuat: {new Date(project.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            <Suspense fallback={<div className="h-40 flex items-center justify-center"><LoadingMessage /></div>}>
                <SaweriaWidget />
            </Suspense>

            <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
            
            {projectToDelete && (
                <DeleteProjectSliderModal
                    show={!!projectToDelete}
                    onClose={() => setProjectToDelete(null)}
                    onConfirm={handleDeleteProject}
                    isConfirmLoading={isDeleting}
                    projectNameToDelete={projectToDelete.project_data.brandInputs.businessName}
                    projectLogoUrl={projectToDelete.project_data.selectedLogoUrl}
                />
            )}
            
            <ConfirmationModal
                show={showShareConfirm}
                onClose={() => setShowShareConfirm(false)}
                onConfirm={executeShareToForum}
                title="Pamerin Brand Keren Lo?"
                confirmText="Gas, Pamerin!"
                cancelText="Nanti Dulu Deh"
            >
                <p>Mantap! Project ini bakal tampil di <strong className="text-text-header">"Pameran Brand"</strong> biar bisa diliat sama juragan lain. Mereka bisa kasih 'Menyala!' 🔥 buat nambah XP lo.</p>
            </ConfirmationModal>

        </div>
    );
};

export default ProjectDashboard;
