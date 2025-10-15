// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { playSound } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus, Profile, AIPetState } from './types';
import { useAuth, BgmSelection } from './contexts/AuthContext';
import { useAIPet } from './contexts/AIPetContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';
import { useTranslation } from './contexts/LanguageContext';

// --- API Services ---
import * as geminiService from './services/geminiService';
import { fetchImageAsBase64 } from './utils/imageUtils';

// --- Error Handling & Loading ---
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import LoadingMessage from './components/common/LoadingMessage';
import ErrorMessage from './components/common/ErrorMessage';

// --- Core Components ---
import LoginScreen from './components/LoginScreen';
import ProgressStepper from './components/common/ProgressStepper';
import AdBanner from './components/AdBanner';
import Toast from './components/common/Toast';
import CalloutPopup from './components/common/CalloutPopup';

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
const AIPetVisual = React.lazy(() => import('./components/AIPetVisual'));
const AIPetLabModal = React.lazy(() => import('./components/AIPetLabModal'));
const AIPetContextualBubble = React.lazy(() => import('./components/AIPetContextualBubble'));
const AIPetInteractionBubble = React.lazy(() => import('./components/AIPetInteractionBubble'));
const TokenomicsModal = React.lazy(() => import('./components/common/TokenomicsModal'));
const VoiceBrandingWizard = React.lazy(() => import('./components/VoiceBrandingWizard'));

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'social_kit' | 'profiles' | 'packaging' | 'print_media' | 'content_calendar' | 'social_ads' | 'merchandise' | 'summary' | 'caption' | 'instant_content';

const App: React.FC = () => {
    const { session, user, profile, loading: authLoading, projects, setProjects, executeLogout, authError } = useAuth();
    const ui = useUI();
    const userActions = useUserActions();
    const aipetContext = useAIPet();
    const { petState, isPetOnScreen } = aipetContext;
    
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

    // --- Workflow Step Completion Handlers ---
    const saveLocalCheckpoint = useCallback((updatedData: Partial<ProjectData>) => { const currentState = loadWorkflowState() || {}; const combinedData = { ...currentState, ...updatedData }; saveWorkflowState(combinedData); ui.showToast("Progres tersimpan sementara!"); }, [ui]);
    const handlePersonaComplete = useCallback(async (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => { saveLocalCheckpoint({ brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan }); await userActions.grantFirstTimeCompletionBonus('persona'); navigateTo('logo'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleLogoComplete = useCallback(async (data: { logoBase64: string; prompt: string }) => { saveLocalCheckpoint({ selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt }); await userActions.grantFirstTimeCompletionBonus('logo'); navigateTo('logo_detail'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleLogoDetailComplete = useCallback(async (data: { finalLogoUrl: string; variations: LogoVariations }) => { saveLocalCheckpoint({ selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations }); await userActions.grantFirstTimeCompletionBonus('logo_detail'); navigateTo('social_kit'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleSocialKitComplete = useCallback(async (data: { assets: SocialMediaKitAssets }) => { saveLocalCheckpoint({ socialMediaKit: data.assets }); await userActions.grantFirstTimeCompletionBonus('social_kit'); navigateTo('profiles'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleProfilesComplete = useCallback(async (data: { profiles: SocialProfileData }) => { saveLocalCheckpoint({ socialProfiles: data.profiles }); await userActions.grantFirstTimeCompletionBonus('profiles'); navigateTo('packaging'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handlePackagingComplete = useCallback(async (data: { packagingUrl: string }) => { saveLocalCheckpoint({ selectedPackagingUrl: data.packagingUrl }); await userActions.grantFirstTimeCompletionBonus('packaging'); navigateTo('print_media'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handlePrintMediaComplete = useCallback(async (data: { assets: PrintMediaAssets }) => { saveLocalCheckpoint({ printMediaAssets: data.assets }); await userActions.grantFirstTimeCompletionBonus('print_media'); navigateTo('content_calendar'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleContentCalendarComplete = useCallback(async (data: { calendar: ContentCalendarEntry[], sources: any[] }) => { saveLocalCheckpoint({ contentCalendar: data.calendar, searchSources: data.sources }); await userActions.grantFirstTimeCompletionBonus('content_calendar'); navigateTo('social_ads'); }, [saveLocalCheckpoint, userActions, navigateTo]);
    const handleSocialAdsComplete = useCallback(async (data: { adsData: SocialAdsData }) => { saveLocalCheckpoint({ socialAds: data.adsData }); await userActions.grantFirstTimeCompletionBonus('social_ads'); navigateTo('merchandise'); }, [saveLocalCheckpoint, userActions, navigateTo]);

    const handleMerchandiseComplete = useCallback(async (merchandiseUrl: string) => {
        if (!session?.user || !selectedProjectId || !profile) return;
        const currentState = loadWorkflowState() || {}; const finalProjectData = { ...currentState, merchandiseUrl };
        await userActions.grantFirstTimeCompletionBonus('merchandise');
        await userActions.addXp(500); aipetContext.notifyPetOfActivity('project_completed');
        // Final DB update
        const { data: dbData, error: projectError } = await supabase.from('projects').update({ project_data: finalProjectData, status: 'completed' as ProjectStatus }).eq('id', selectedProjectId).select().single();
        if (projectError) { setGeneralError(`Gagal menyimpan finalisasi project: ${projectError.message}`); return; }
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? (dbData as Project) : p));
        handleReturnToDashboard(); ui.showToast("Mantap! Project lo berhasil diselesaikan.");
    }, [session, selectedProjectId, profile, userActions, aipetContext, handleReturnToDashboard, ui, setProjects]);
    
    const handleVoiceWizardComplete = useCallback(async (projectData: Partial<ProjectData>) => { ui.toggleVoiceWizard(false); await handleNewProject(projectData); }, [handleNewProject, ui]);

    // --- Content Rendering ---
    const renderContent = () => {
        const workflowData = loadWorkflowState();
        const commonProps = { onGoToDashboard: handleReturnToDashboard };
        switch (appState) {
            case 'dashboard': return <ProjectDashboard projects={projects} onNewProject={handleNewProject} onSelectProject={handleSelectProject} onDeleteProject={handleRequestDeleteProject} onPreloadNewProject={() => import('./components/BrandPersonaGenerator')} onShowSotoshop={() => ui.toggleSotoshop(true)} />;
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
            case 'summary': const project = projects.find(p => p.id === selectedProjectId); return project ? <ProjectSummary project={project} onStartNew={handleReturnToDashboard} onGoToCaptionGenerator={(id) => { saveWorkflowState(project.project_data); setSelectedProjectId(id); navigateTo('caption'); }} onGoToInstantContent={(id) => { saveWorkflowState(project.project_data); setSelectedProjectId(id); navigateTo('instant_content'); }} onDeleteProject={handleRequestDeleteProject} onRegenerateContentCalendar={() => {}} onRegenerateSocialKit={() => {}} onRegenerateProfiles={() => {}} onRegenerateSocialAds={() => {}} onRegeneratePackaging={() => {}} onRegeneratePrintMedia={() => {}} onRegenerateMerchandise={() => {}} onShareToForum={() => {}} /> : null;
            case 'caption': return workflowData && selectedProjectId ? <CaptionGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} /> : null;
            case 'instant_content': return workflowData && selectedProjectId ? <InstantContentGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} /> : null;
            default: handleReturnToDashboard(); return <AuthLoadingScreen />;
        }
    };
    
    if (authLoading) return <AuthLoadingScreen />;
    if (!session) return ( <> <LoginScreen isCaptchaSolved={!showCaptcha} /> <Suspense fallback={null}> <PuzzleCaptchaModal show={showCaptcha} onSuccess={() => setShowCaptcha(false)} /> </Suspense> </> );
    
    return (
      <>
        <div className={`min-h-screen bg-background text-text-body transition-all duration-300`}>
             <AppHeader onReturnToDashboard={handleRequestReturnToDashboard} />
            <main id="main-content" className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {authError && <ErrorMessage message={authError} onGoToDashboard={handleReturnToDashboard} />}
                    {generalError ? (<ErrorMessage message={`Terjadi error: ${generalError}`} onGoToDashboard={handleReturnToDashboard} />) : (
                        <ErrorBoundary onReset={handleReturnToDashboard}>
                            {showStepper && <ProgressStepper currentStep={currentStepIndex} />}
                            <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><LoadingMessage /></div>}>
                                <div key={appState} className="animate-content-fade-in">{renderContent()}</div>
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </div>
            </main>
            <AdBanner />
            <Toast message={ui.toast.message} show={ui.toast.show} onClose={ui.closeToast} />
        </div>

        {/* --- Global Modals & Overlays --- */}
        <Suspense fallback={null}>
            <Sotoshop show={ui.showSotoshop} onClose={() => ui.toggleSotoshop(false)} />
            <ContactModal show={ui.showContactModal} onClose={() => ui.toggleContactModal(false)} />
            <AboutModal show={ui.showAboutModal} onClose={() => ui.toggleAboutModal(false)} />
            <TermsOfServiceModal show={ui.showToSModal} onClose={() => ui.toggleToSModal(false)} />
            <PrivacyPolicyModal show={ui.showPrivacyModal} onClose={() => ui.togglePrivacyModal(false)} />
            <ProfileSettingsModal show={ui.showProfileModal} onClose={() => ui.toggleProfileModal(false)} />
            <BrandGalleryModal show={ui.showBrandGalleryModal} onClose={() => ui.toggleBrandGalleryModal(false)} />
            <TokenomicsModal show={ui.showTokenomicsModal} onClose={() => ui.toggleTokenomicsModal(false)} />
            <AIPetLabModal show={ui.showAIPetLab} onClose={() => ui.toggleAIPetLab(false)} />
            <VoiceBrandingWizard show={ui.showVoiceWizard} onClose={() => ui.toggleVoiceWizard(false)} onComplete={handleVoiceWizardComplete} profile={profile} deductCredits={userActions.deductCredits} setShowOutOfCreditsModal={userActions.setShowOutOfCreditsModal}/>
            
            <OutOfCreditsModal show={userActions.showOutOfCreditsModal} onClose={() => userActions.setShowOutOfCreditsModal(false)} />
            <ConfirmationModal show={showDashboardConfirm} onClose={() => setShowDashboardConfirm(false)} onConfirm={confirmAndReturnToDashboard} title="Kembali ke Dashboard?" confirmText="Ya, Kembali" cancelText="Batal">Progres di tahap ini bakal hilang. Yakin mau kembali?</ConfirmationModal>
            <DeleteProjectSliderModal show={!!projectToDelete} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} isConfirmLoading={isDeleting} projectNameToDelete={projectToDelete?.project_data?.brandInputs?.businessName || 'Project Ini'} projectLogoUrl={projectToDelete?.project_data?.selectedLogoUrl} />
            <LevelUpModal show={userActions.showLevelUpModal} onClose={() => userActions.setShowLevelUpModal(false)} levelUpInfo={userActions.levelUpInfo} />
            <AchievementToast achievement={userActions.unlockedAchievement} onClose={() => userActions.setUnlockedAchievement(null)} />
        </Suspense>
      </>
    );
};

const AppHeader: React.FC<{ onReturnToDashboard: () => void }> = React.memo(({ onReturnToDashboard }) => {
    const { session, profile, isMuted, handleToggleMute, bgmSelection, handleBgmChange } = useAuth();
    const ui = useUI();
    const aipetContext = useAIPet();
    const { petState } = aipetContext;
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('desainfun_theme') as 'light' | 'dark') || 'dark');

    const toggleTheme = () => setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('desainfun_theme', newTheme);
        return newTheme;
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="py-3 px-4 sm:px-6 lg:px-8 bg-surface/80 backdrop-blur-lg sticky top-0 z-20 border-b border-border-main transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 accent-stripes"></div>
            <div className="max-w-7xl mx-auto flex justify-between items-center relative pt-1.5">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider cursor-pointer transition-transform hover:scale-105" onClick={onReturnToDashboard} style={{fontFamily: 'var(--font-display)'}}>
                    <span className="text-primary">des<span className="text-accent">ai</span>n</span><span className="text-text-header">.fun</span>
                </h1>
                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => ui.toggleTokenomicsModal(true)} title="Info Token" className="flex items-center gap-1.5 p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-splash" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        <span className="font-bold text-base text-text-header">{profile?.credits ?? 0}</span>
                    </button>
                    {/* Theme Toggle Component could be extracted */}
                    <button onClick={toggleTheme} title="Ganti Tema" className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">
                        <div className="w-5 h-5">{theme === 'dark' ? '☀️' : '🌙'}</div>
                    </button>
                    
                    {!aipetContext.isLoading && petState && (
                        <button onClick={() => { playSound('click'); ui.toggleAIPetLab(true); }} title="Buka AIPet Lab" className="flex items-center gap-2 rounded-full p-1 pr-3 bg-background hover:bg-border-light transition-colors border border-border-main group">
                            <div className="w-9 h-9 flex items-center justify-center relative transition-transform group-hover:scale-110">
                                {petState.stage === 'active' && petState.blueprint ? (<div className="absolute inset-0 scale-[1.4] top-1"><Suspense fallback={<div className="w-full h-full bg-border-main rounded-full animate-pulse" />}><AIPetVisual petState={petState} behavior="idle" /></Suspense></div>) : (<div className="text-2xl animate-pulse filter drop-shadow-[0_0_4px_rgb(var(--c-primary))]">💎</div>)}
                            </div>
                            <span className="text-sm font-semibold text-text-header hidden sm:block">{petState.stage === 'active' ? petState.name : 'AIPod'}</span>
                        </button>
                    )}

                    <div ref={userMenuRef} className="relative">
                        <button onClick={() => setIsUserMenuOpen(p => !p)} title="User Menu" className="flex items-center gap-2 rounded-full p-1 pl-3 bg-background hover:bg-border-light transition-colors border border-transparent hover:border-border-main">
                            <Suspense fallback={null}><HeaderStats profile={profile} /></Suspense>
                            <img src={session?.user.user_metadata.avatar_url || ''} alt={session?.user.user_metadata.full_name || 'User Avatar'} className="w-9 h-9 rounded-full border-2 border-border-main" />
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-main rounded-lg shadow-lg py-1.5 z-30 animate-content-fade-in">
                               <div className="px-4 py-2 border-b border-border-main">
                                    <p className="font-bold text-text-header truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-text-muted">{session?.user.email}</p>
                               </div>
                               <button onClick={() => { ui.toggleProfileModal(true); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">Pengaturan & Lencana</button>
                               <button onClick={() => { ui.toggleAboutModal(true); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">Tentang Aplikasi</button>
                               <div className="border-t border-border-main my-1"></div>
                               <a href="https://saweria.co/logoku" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background">Traktir Kopi ☕</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});


export default App;
