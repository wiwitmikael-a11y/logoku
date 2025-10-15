// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { playSound } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus } from './types';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';

// --- API Services ---
import * as geminiService from './services/geminiService';
import { fetchImageAsBase64 } from './utils/imageUtils';

// --- Error Handling & Loading ---
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import LoadingMessage from './components/common/LoadingMessage';

// --- Core Components ---
import LoginScreen from './components/LoginScreen';
import ProgressStepper from './components/common/ProgressStepper';
import AdBanner from './components/AdBanner';
import Toast from './components/common/Toast';

// --- Lazily Loaded Components ---
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const InstantContentGenerator = React.lazy(() => import('./components/InstantContentGenerator'));
const ContactModal = React.lazy(() => import('./components/common/ContactModal'));
const AboutModal = React.lazy(() => import('./components/common/AboutModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const PrivacyPolicyModal = React.lazy(() => import('./components/common/PrivacyPolicyModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const ConfirmationModal = React.lazy(() => import('./components/common/ConfirmationModal'));
const DeleteProjectSliderModal = React.lazy(() => import('./components/common/DeleteProjectSliderModal'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const SocialMediaKitGenerator = React.lazy(() => import('./components/SocialMediaKitGenerator'));
const ProfileOptimizer = React.lazy(() => import('./components/ProfileOptimizer'));
const SocialAdsGenerator = React.lazy(() => import('./components/SocialAdsGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const MerchandiseGenerator = React.lazy(() => import('./components/MerchandiseGenerator'));
const HeaderStats = React.lazy(() => import('./components/gamification/HeaderStats'));
const LevelUpModal = React.lazy(() => import('./components/gamification/LevelUpModal'));
const AchievementToast = React.lazy(() => import('./components/gamification/AchievementToast'));
const BrandGalleryModal = React.lazy(() => import('./components/BrandGalleryModal'));
const Sotoshop = React.lazy(() => import('./components/Sotoshop'));
const TokenomicsModal = React.lazy(() => import('./components/common/TokenomicsModal'));
const VoiceBrandingWizard = React.lazy(() => import('./components/VoiceBrandingWizard'));

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'social_kit' | 'profiles' | 'packaging' | 'print_media' | 'content_calendar' | 'social_ads' | 'merchandise' | 'summary' | 'caption' | 'instant_content';

const App: React.FC = () => {
    const { session, user, profile, loading: authLoading, projects, setProjects, executeLogout, authError } = useAuth();
    const ui = useUI();
    const userActions = useUserActions();
    
    const [appState, setAppState] = useState<AppState>(() => (sessionStorage.getItem('desainfun_app_state') as AppState) || 'dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
        const id = sessionStorage.getItem('desainfun_project_id');
        return id ? parseInt(id, 10) : null;
    });

    const [generalError, setGeneralError] = useState<string | null>(null);
    const [showCaptcha, setShowCaptcha] = useState(true);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDashboardConfirm, setShowDashboardConfirm] = useState(false);
    
    const previousAppState = useRef<AppState>(appState);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'social_kit', 'profiles', 'packaging', 'print_media', 'content_calendar', 'social_ads', 'merchandise'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;
    
    // --- State Persistence & Navigation ---
    useEffect(() => {
        if (session) {
            if (appState === 'dashboard') { sessionStorage.removeItem('desainfun_app_state'); sessionStorage.removeItem('desainfun_project_id'); }
            else { sessionStorage.setItem('desainfun_app_state', appState); if (selectedProjectId !== null) sessionStorage.setItem('desainfun_project_id', selectedProjectId.toString()); else sessionStorage.removeItem('desainfun_project_id'); }
        }
    }, [appState, selectedProjectId, session]);
    
    useEffect(() => { if (!session && !authLoading) setShowCaptcha(true); else setShowCaptcha(false); }, [session, authLoading]);
    
    useEffect(() => {
        if (previousAppState.current !== appState) { playSound('transition'); window.scrollTo(0, 0); }
        previousAppState.current = appState;
    }, [appState]);
    
    const navigateTo = (state: AppState) => setAppState(state);
    const handleReturnToDashboard = useCallback(() => { clearWorkflowState(); setSelectedProjectId(null); navigateTo('dashboard'); }, []);
    const handleRequestReturnToDashboard = useCallback(() => { if (appState === 'dashboard') { handleReturnToDashboard(); return; } setShowDashboardConfirm(true); }, [appState, handleReturnToDashboard]);
    const confirmAndReturnToDashboard = useCallback(() => { handleReturnToDashboard(); setShowDashboardConfirm(false); }, [handleReturnToDashboard]);

    // --- Project Management ---
    const handleNewProject = useCallback(async (templateData?: Partial<ProjectData>) => {
        if (!session?.user || !profile) return;
        if (profile.total_projects_completed === 0 && projects.length === 0) sessionStorage.setItem('onboardingStep2', 'true');
        const { data, error } = await supabase.from('projects').insert({ user_id: session.user.id, project_data: {}, status: 'in-progress' as ProjectStatus }).select().single();
        if (error) { setGeneralError(`Gagal memulai project baru: ${error.message}`); return; }
        const newProject: Project = data as any;
        setProjects(prev => [newProject, ...prev]); setSelectedProjectId(newProject.id);
        if (templateData) saveWorkflowState(templateData); else clearWorkflowState();
        navigateTo('persona');
    }, [session, profile, projects, setProjects]);

    const handleSelectProject = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId); if (!project) return;
        setSelectedProjectId(projectId); saveWorkflowState(project.project_data);
        if (project.status === 'completed') { navigateTo('summary'); }
        else {
            const data = project.project_data; let nextState: AppState = 'persona';
            if (data.selectedPersona) if (data.selectedLogoUrl) if (data.logoVariations) if (data.socialMediaKit) if (data.socialProfiles) if (data.selectedPackagingUrl) if (data.printMediaAssets) if (data.contentCalendar) if (data.socialAds) nextState = data.merchandiseUrl ? 'summary' : 'merchandise'; else nextState = 'social_ads'; else nextState = 'content_calendar'; else nextState = 'print_media'; else nextState = 'packaging'; else nextState = 'profiles'; else nextState = 'social_kit'; else nextState = 'logo_detail'; else nextState = 'logo';
            navigateTo(nextState);
        }
    }, [projects]);
    
    const handleRequestDeleteProject = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { setProjectToDelete(project); } }, [projects]);
    const handleCancelDelete = useCallback(() => { setProjectToDelete(null); }, []);
    const handleConfirmDelete = useCallback(async () => {
        if (!projectToDelete || !user) return; setIsDeleting(true);
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
        setIsDeleting(false);
        if (error) { setGeneralError(`Gagal menghapus project: ${error.message}`); }
        else { setProjects(prev => prev.filter(p => p.id !== projectToDelete.id)); if (selectedProjectId === projectToDelete.id) handleReturnToDashboard(); playSound('success'); }
        setProjectToDelete(null);
    }, [projectToDelete, user, selectedProjectId, handleReturnToDashboard, setProjects]);
    
    const handleShareToForum = useCallback((project: Project) => {
        const { brandInputs } = project.project_data;
        if (!brandInputs) return;
        const forumPreload = { title: `Minta masukan dong buat brand baruku: "${brandInputs.businessName}"`, content: `Halo Juragan semua!\n\nAku baru aja selesai ngeracik brand baru pakai Mang AI, namanya "${brandInputs.businessName}". Ini brand yang bergerak di bidang ${brandInputs.industry}.\n\nKira-kira ada masukan nggak soal logo, nama, atau apa aja biar makin gacor?\n\nMakasih sebelumnya!` };
        sessionStorage.setItem('forumPreload', JSON.stringify(forumPreload)); 
        sessionStorage.setItem('openForumTab', 'true'); 
        handleReturnToDashboard();
    }, [handleReturnToDashboard]);

    // --- Workflow Completion Handlers ---
    const saveLocalCheckpoint = useCallback((updatedData: Partial<ProjectData>) => {
        const currentState = loadWorkflowState() || {};
        const combinedData = { ...currentState, ...updatedData };
        saveWorkflowState(combinedData);
        ui.showToast("Progres tersimpan sementara!");
    }, [ui]);

    const handlePersonaComplete = useCallback((data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => { saveLocalCheckpoint({ brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan }); userActions.grantFirstTimeCompletionBonus('persona'); navigateTo('logo'); }, [saveLocalCheckpoint, userActions]);
    const handleLogoComplete = useCallback((data: { logoBase64: string; prompt: string }) => { saveLocalCheckpoint({ selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt }); userActions.grantFirstTimeCompletionBonus('logo'); navigateTo('logo_detail'); }, [saveLocalCheckpoint, userActions]);
    const handleLogoDetailComplete = useCallback((data: { finalLogoUrl: string; variations: LogoVariations }) => { saveLocalCheckpoint({ selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations }); userActions.grantFirstTimeCompletionBonus('logo_detail'); navigateTo('social_kit'); }, [saveLocalCheckpoint, userActions]);
    const handleSocialKitComplete = useCallback((data: { assets: SocialMediaKitAssets }) => { saveLocalCheckpoint({ socialMediaKit: data.assets }); userActions.grantFirstTimeCompletionBonus('social_kit'); navigateTo('profiles'); }, [saveLocalCheckpoint, userActions]);
    const handleProfilesComplete = useCallback((data: { profiles: SocialProfileData }) => { saveLocalCheckpoint({ socialProfiles: data.profiles }); userActions.grantFirstTimeCompletionBonus('profiles'); navigateTo('packaging'); }, [saveLocalCheckpoint, userActions]);
    const handlePackagingComplete = useCallback((data: { packagingUrl: string }) => { saveLocalCheckpoint({ selectedPackagingUrl: data.packagingUrl }); userActions.grantFirstTimeCompletionBonus('packaging'); navigateTo('print_media'); }, [saveLocalCheckpoint, userActions]);
    const handlePrintMediaComplete = useCallback((data: { assets: PrintMediaAssets }) => { saveLocalCheckpoint({ printMediaAssets: data.assets }); userActions.grantFirstTimeCompletionBonus('print_media'); navigateTo('content_calendar'); }, [saveLocalCheckpoint, userActions]);
    const handleContentCalendarComplete = useCallback((data: { calendar: ContentCalendarEntry[], sources: any[] }) => { saveLocalCheckpoint({ contentCalendar: data.calendar, searchSources: data.sources }); userActions.grantFirstTimeCompletionBonus('content_calendar'); navigateTo('social_ads'); }, [saveLocalCheckpoint, userActions]);
    const handleSocialAdsComplete = useCallback((data: { adsData: SocialAdsData }) => { saveLocalCheckpoint({ socialAds: data.adsData }); userActions.grantFirstTimeCompletionBonus('social_ads'); navigateTo('merchandise'); }, [saveLocalCheckpoint, userActions]);
    
    const handleMerchandiseComplete = useCallback(async (merchandiseUrl: string) => {
        if (!session?.user || !selectedProjectId || !profile) return; 
        const currentState = loadWorkflowState() || {}; 
        const finalProjectData = { ...currentState, merchandiseUrl };
        await userActions.grantFirstTimeCompletionBonus('merchandise'); 
        const { data: dbData, error: projectError } = await supabase.from('projects').update({ project_data: finalProjectData, status: 'completed' as ProjectStatus }).eq('id', selectedProjectId).select().single();
        if (projectError) { setGeneralError(`Gagal menyimpan finalisasi project: ${projectError.message}`); return; } 
        await userActions.addXp(500);
        const newTotalCompleted = (profile.total_projects_completed ?? 0) + 1;
        if (newTotalCompleted === 1) await userActions.grantAchievement('BRAND_PERTAMA_LAHIR'); 
        else if (newTotalCompleted === 5) await userActions.grantAchievement('SANG_KOLEKTOR'); 
        else if (newTotalCompleted === 10) await userActions.grantAchievement('SULTAN_KONTEN');
        
        const updatedProject: Project = dbData as any; 
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        handleReturnToDashboard(); 
        ui.showToast("Mantap! Project lo berhasil diselesaikan.");
    }, [session, selectedProjectId, profile, userActions, setProjects, handleReturnToDashboard, ui]);

    // --- Regenerate Handlers for Project Summary ---
    const handleRegenerateAsset = useCallback(async <T extends any>(
        projectId: number,
        cost: number,
        updateLogic: (project: Project) => Promise<Partial<ProjectData>>,
        successMessage: string
    ) => {
        if (!profile || profile.credits < cost) {
            userActions.setShowOutOfCreditsModal(true);
            return;
        }

        const project = projects.find(p => p.id === projectId);
        if (!project) {
            setGeneralError("Project tidak ditemukan untuk digenerate ulang.");
            return;
        }

        if (!(await userActions.deductCredits(cost))) {
            return; // Deduction failed (e.g., insufficient credits after a race condition)
        }
        
        try {
            const updates = await updateLogic(project);
            const updatedProjectData = { ...project.project_data, ...updates };

            const { data, error } = await supabase
                .from('projects')
                .update({ project_data: updatedProjectData })
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;
            
            setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p));
            ui.showToast(successMessage);
        } catch (err) {
            setGeneralError(err instanceof Error ? err.message : 'Gagal membuat ulang aset.');
            // Note: Credits are already deducted. A more robust system might refund on failure.
        }
    }, [projects, profile, userActions, ui, setProjects]);

    const handleRegenerateContentCalendar = useCallback((projectId: number) => handleRegenerateAsset(projectId, 1, async (p) => {
        const { calendar, sources } = await geminiService.generateContentCalendar(p.project_data.brandInputs!.businessName, p.project_data.selectedPersona!);
        return { contentCalendar: calendar, searchSources: sources };
    }, "Kalender konten baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegenerateSocialKit = useCallback((projectId: number) => handleRegenerateAsset(projectId, 2, async (p) => {
        const assets = await geminiService.generateSocialMediaKitAssets(p.project_data as ProjectData);
        return { socialMediaKit: assets };
    }, "Social media kit baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegenerateProfiles = useCallback((projectId: number) => handleRegenerateAsset(projectId, 1, async (p) => {
        const profiles = await geminiService.generateSocialProfiles(p.project_data.brandInputs!, p.project_data.selectedPersona!);
        return { socialProfiles: profiles };
    }, "Profil sosmed baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegenerateSocialAds = useCallback((projectId: number) => handleRegenerateAsset(projectId, 1, async (p) => {
        const adsData = await geminiService.generateSocialAds(p.project_data.brandInputs!, p.project_data.selectedPersona!, p.project_data.selectedSlogan!);
        return { socialAds: adsData };
    }, "Teks iklan baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegeneratePackaging = useCallback((projectId: number) => handleRegenerateAsset(projectId, 1, async (p) => {
        const { brandInputs, selectedPersona, selectedLogoUrl } = p.project_data;
        const prompt = `Take the provided logo image. Create a realistic, high-quality product mockup of a generic product box for "${brandInputs!.businessDetail}". Place the logo prominently. The brand is "${brandInputs!.businessName}". The style is ${selectedPersona!.kata_kunci.join(', ')}, modern, and clean. This is a commercial product photo.`;
        const logoBase64 = await fetchImageAsBase64(selectedLogoUrl!);
        const [packagingUrl] = await geminiService.generatePackagingDesign(prompt, logoBase64);
        return { selectedPackagingUrl: packagingUrl };
    }, "Desain kemasan baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegenerateMerchandise = useCallback((projectId: number) => handleRegenerateAsset(projectId, 1, async (p) => {
        const prompt = 'Take the provided logo image. Create a realistic mockup of a plain colored t-shirt on a clean, neutral background. The t-shirt prominently features the logo. The photo is high-quality, commercial-style, showing the texture of the fabric.';
        const logoBase64 = await fetchImageAsBase64(p.project_data.selectedLogoUrl!);
        const [merchandiseUrl] = await geminiService.generateMerchandiseMockup(prompt, logoBase64);
        return { merchandiseUrl: merchandiseUrl };
    }, "Mockup merchandise baru berhasil dibuat!"), [handleRegenerateAsset]);

    const handleRegeneratePrintMedia = useCallback(async (projectId: number, mediaType: 'banner' | 'roll_banner') => {
        await handleRegenerateAsset(projectId, 1, async (p) => {
            const { selectedPersona, selectedLogoUrl, logoVariations } = p.project_data;
            let prompt = '';
            const colors = selectedPersona!.palet_warna_hex.join(', ');
            const style = selectedPersona!.kata_kunci.join(', ');
            let logoToUseUrl = selectedLogoUrl!;
            let promptContainsText = false;
            if (mediaType === 'banner' && logoVariations?.horizontal) { logoToUseUrl = logoVariations.horizontal; promptContainsText = true; }
            else if (mediaType === 'roll_banner' && logoVariations?.stacked) { logoToUseUrl = logoVariations.stacked; promptContainsText = true; }
            const textInstruction = promptContainsText ? "The provided logo already has text, so DO NOT generate any additional text." : "DO NOT generate any text, letters, or words.";
            
            if (mediaType === 'banner') {
                prompt = `Take the provided logo image. Create a visually stunning and highly functional flat graphic design TEMPLATE for a wide horizontal outdoor banner (spanduk, 3:1 aspect ratio). ... ${textInstruction}`;
            } else {
                prompt = `Take the provided logo image. Create a visually stunning and highly functional flat graphic design TEMPLATE for a vertical roll-up banner ... ${textInstruction}`;
            }
            
            const logoBase64 = await fetchImageAsBase64(logoToUseUrl);
            const [resultUrl] = await geminiService.generatePrintMedia(prompt, logoBase64);
            const currentAssets = p.project_data.printMediaAssets || {};
            const updatedAssets = mediaType === 'banner' ? { ...currentAssets, bannerUrl: resultUrl } : { ...currentAssets, rollBannerUrl: resultUrl };
            return { printMediaAssets: updatedAssets };
        }, `Template ${mediaType === 'banner' ? 'spanduk' : 'roll banner'} baru berhasil dibuat!`);
    }, [handleRegenerateAsset]);


    const handleGoToCaptionGenerator = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { saveWorkflowState(project.project_data); setSelectedProjectId(project.id); navigateTo('caption'); } }, [projects]);
    const handleGoToInstantContent = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { saveWorkflowState(project.project_data); setSelectedProjectId(project.id); navigateTo('instant_content'); } }, [projects]);
    
    const executeLogoutAndCleanup = useCallback(async () => {
        clearWorkflowState();
        sessionStorage.clear();
        await executeLogout();
        setAppState('dashboard');
        setSelectedProjectId(null);
    }, [executeLogout]);

    if (authLoading) return <AuthLoadingScreen />;
    if (!session) return (
        <>
            <LoginScreen isCaptchaSolved={!showCaptcha} />
            <Suspense fallback={null}>
                <PuzzleCaptchaModal show={showCaptcha} onSuccess={() => setShowCaptcha(false)} />
                <TermsOfServiceModal show={ui.showToSModal} onClose={() => ui.toggleToSModal(false)} />
                <PrivacyPolicyModal show={ui.showPrivacyModal} onClose={() => ui.togglePrivacyModal(false)} />
            </Suspense>
        </>
    );

    const renderContent = () => {
        const workflowData = loadWorkflowState();
        const commonProps = { onGoToDashboard: handleReturnToDashboard };
        
        switch (appState) {
            case 'persona': return <BrandPersonaGenerator onComplete={handlePersonaComplete} {...commonProps} />;
            case 'logo': return workflowData?.selectedPersona && workflowData.brandInputs ? <LogoGenerator persona={workflowData.selectedPersona} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoComplete} {...commonProps} /> : null;
            case 'logo_detail': return workflowData?.selectedLogoUrl && workflowData.logoPrompt && workflowData.brandInputs ? <LogoDetailGenerator baseLogoUrl={workflowData.selectedLogoUrl} basePrompt={workflowData.logoPrompt} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoDetailComplete} {...commonProps} /> : null;
            case 'social_kit': return <SocialMediaKitGenerator projectData={workflowData || {}} onComplete={handleSocialKitComplete} {...commonProps} />;
            case 'profiles': return <ProfileOptimizer projectData={workflowData || {}} onComplete={handleProfilesComplete} {...commonProps} />;
            case 'packaging': return <PackagingGenerator projectData={workflowData || {}} onComplete={handlePackagingComplete} {...commonProps} />;
            case 'print_media': return <PrintMediaGenerator projectData={workflowData || {}} onComplete={handlePrintMediaComplete} {...commonProps} />;
            case 'content_calendar': return <ContentCalendarGenerator projectData={workflowData || {}} onComplete={handleContentCalendarComplete} {...commonProps} />;
            case 'social_ads': return <SocialAdsGenerator projectData={workflowData || {}} onComplete={handleSocialAdsComplete} {...commonProps} />;
            case 'merchandise': return <MerchandiseGenerator projectData={workflowData || {}} onComplete={handleMerchandiseComplete} {...commonProps} />;
            case 'summary': const project = projects.find(p => p.id === selectedProjectId); return project ? <ProjectSummary project={project} onStartNew={handleReturnToDashboard} onGoToCaptionGenerator={handleGoToCaptionGenerator} onGoToInstantContent={handleGoToInstantContent} onDeleteProject={handleRequestDeleteProject} onShareToForum={handleShareToForum} onRegenerateContentCalendar={() => handleRegenerateContentCalendar(project.id)} onRegenerateSocialKit={() => handleRegenerateSocialKit(project.id)} onRegenerateProfiles={() => handleRegenerateProfiles(project.id)} onRegenerateSocialAds={() => handleRegenerateSocialAds(project.id)} onRegeneratePackaging={() => handleRegeneratePackaging(project.id)} onRegeneratePrintMedia={(mediaType) => handleRegeneratePrintMedia(project.id, mediaType)} onRegenerateMerchandise={() => handleRegenerateMerchandise(project.id)} /> : null;
            case 'caption': return workflowData && selectedProjectId ? <CaptionGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} /> : null;
            case 'instant_content': return workflowData && selectedProjectId ? <InstantContentGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} /> : null;
            case 'dashboard': default: return <ProjectDashboard projects={projects} onNewProject={handleNewProject} onSelectProject={handleSelectProject} onDeleteProject={handleRequestDeleteProject} onPreloadNewProject={() => import('./components/BrandPersonaGenerator')} onShowSotoshop={() => ui.toggleSotoshop(true)} />;
        }
    };

    return (
      <div className="min-h-screen bg-background text-text-body">
        {/* Header and main content here, simplified */}
        <main id="main-content" className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <ErrorBoundary onReset={handleReturnToDashboard}>
                    {showStepper && <ProgressStepper currentStep={currentStepIndex} />}
                    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><LoadingMessage /></div>}>
                        <div key={appState} className="animate-content-fade-in">{renderContent()}</div>
                    </Suspense>
                </ErrorBoundary>
            </div>
        </main>

        <Toast message={ui.toast.message} show={ui.toast.show} onClose={ui.closeToast} />
        
        <Suspense fallback={null}>
            <ContactModal show={ui.showContactModal} onClose={() => ui.toggleContactModal(false)} />
            <AboutModal show={ui.showAboutModal} onClose={() => ui.toggleAboutModal(false)} />
            <TermsOfServiceModal show={ui.showToSModal} onClose={() => ui.toggleToSModal(false)} />
            <PrivacyPolicyModal show={ui.showPrivacyModal} onClose={() => ui.togglePrivacyModal(false)} />
            <ProfileSettingsModal show={ui.showProfileModal} onClose={() => ui.toggleProfileModal(false)} />
            <BrandGalleryModal show={ui.showBrandGalleryModal} onClose={() => ui.toggleBrandGalleryModal(false)} />
            <TokenomicsModal show={ui.showTokenomicsModal} onClose={() => ui.toggleTokenomicsModal(false)} />
            <Sotoshop show={ui.showSotoshop} onClose={() => ui.toggleSotoshop(false)} />
            
            <OutOfCreditsModal show={userActions.showOutOfCreditsModal} onClose={() => userActions.setShowOutOfCreditsModal(false)} />
            <LevelUpModal show={userActions.showLevelUpModal} onClose={() => userActions.setShowLevelUpModal(false)} levelUpInfo={userActions.levelUpInfo} />
            <AchievementToast achievement={userActions.unlockedAchievement} onClose={() => userActions.setUnlockedAchievement(null)} />
            
            <ConfirmationModal show={showDashboardConfirm} onClose={() => setShowDashboardConfirm(false)} onConfirm={confirmAndReturnToDashboard} title="Kembali ke Dashboard?" confirmText="Ya, Kembali" cancelText="Batal">Progres di tahap ini bakal hilang. Yakin mau kembali?</ConfirmationModal>
            <DeleteProjectSliderModal show={!!projectToDelete} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} isConfirmLoading={isDeleting} projectNameToDelete={projectToDelete?.project_data?.brandInputs?.businessName || 'Project Ini'} projectLogoUrl={projectToDelete?.project_data?.selectedLogoUrl} />
        </Suspense>
      </div>
    );
};

export default App;