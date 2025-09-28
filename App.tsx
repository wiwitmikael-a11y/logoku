import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { supabase, supabaseError } from './services/supabaseClient';
import { playSound, playBGM, stopBGM } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import { uploadAndSyncProjectAssets } from './services/storageService';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus } from './types';
import { AuthProvider, useAuth, BgmSelection } from './contexts/AuthContext';

// --- Error Handling & Loading ---
import ErrorBoundary from './components/common/ErrorBoundary';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import LoadingMessage from './components/common/LoadingMessage';
import ErrorMessage from './components/common/ErrorMessage';

// --- Core Components ---
import LoginScreen from './components/LoginScreen';
import ProgressStepper from './components/common/ProgressStepper';
import AdBanner from './components/AdBanner';
import Toast from './components/common/Toast'; // New Toast component

// --- Lazily Loaded Components (with new, clear naming) ---
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const SocialMediaKitGenerator = React.lazy(() => import('./components/SocialMediaKitGenerator'));
const ProfileOptimizer = React.lazy(() => import('./components/ProfileOptimizer'));
const SocialAdsGenerator = React.lazy(() => import('./components/SocialAdsGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const InstantContentGenerator = React.lazy(() => import('./components/InstantContentGenerator')); // NEW
const ContactModal = React.lazy(() => import('./components/ContactModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const ConfirmationModal = React.lazy(() => import('./components/common/ConfirmationModal'));
const DeleteProjectSliderModal = React.lazy(() => import('./components/common/DeleteProjectSliderModal'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));
const BrandingTipModal = React.lazy(() => import('./components/common/BrandingTipModal'));


type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'social_kit' | 'profile_optimizer' | 'social_ads' | 'packaging' | 'print_media' | 'summary' | 'caption' | 'instant_content';
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const App: React.FC = () => {
    // Critical startup checks
    if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
    if (!import.meta.env?.VITE_API_KEY) return <ApiKeyErrorScreen />;

    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
};

const MainApp: React.FC = () => {
    const { 
        session, 
        user, 
        profile, 
        loading: authLoading, 
        showOutOfCreditsModal, 
        setShowOutOfCreditsModal,
        showLogoutConfirm,
        setShowLogoutConfirm,
        handleLogout,
        executeLogout: authExecuteLogout, // Renamed to avoid conflict
        handleDeleteAccount, 
        handleToggleMute, 
        isMuted, 
        authError,
        refreshProfile,
        bgmSelection,
        handleBgmChange,
    } = useAuth();
    
    // --- State Persistence on Refresh ---
    const [appState, setAppState] = useState<AppState>(
        () => (sessionStorage.getItem('logoku_app_state') as AppState) || 'dashboard'
    );
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
        const id = sessionStorage.getItem('logoku_project_id');
        return id ? parseInt(id, 10) : null;
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [toast, setToast] = useState({ message: '', show: false });
    const [syncingProjectId, setSyncingProjectId] = useState<number | null>(null);
    
    // State for the welcome banner
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    
    // Modals visibility state
    const [showContactModal, setShowContactModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDashboardConfirm, setShowDashboardConfirm] = useState(false);
    
    // Dropdowns visibility state
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isTokenInfoOpen, setIsTokenInfoOpen] = useState(false);

    // Refs for closing popovers on outside click
    const userMenuRef = useRef<HTMLDivElement>(null);
    const tokenInfoRef = useRef<HTMLDivElement>(null);
    
    const previousAppState = useRef<AppState>(appState);
    const previousSession = useRef<typeof session>(session);

    // NEW, more logical workflow order
    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'content', 'social_kit', 'profile_optimizer', 'social_ads', 'packaging', 'print_media'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;
    
    const showToast = useCallback((message: string) => {
        setToast({ message, show: true });
    }, []);

    // --- Effect for Persisting Navigation State ---
    useEffect(() => {
        if (session) { // Only persist state if user is logged in
            if (appState === 'dashboard') {
                sessionStorage.removeItem('logoku_app_state');
                sessionStorage.removeItem('logoku_project_id');
            } else {
                sessionStorage.setItem('logoku_app_state', appState);
                if (selectedProjectId !== null) {
                    sessionStorage.setItem('logoku_project_id', selectedProjectId.toString());
                } else {
                     sessionStorage.removeItem('logoku_project_id');
                }
            }
        }
    }, [appState, selectedProjectId, session]);
    
    useEffect(() => {
        if (!authLoading && session) {
            // If user just logged in (previous session was null)
            if (!previousSession.current && session) {
                setShowWelcomeBanner(true);
            }
            fetchProjects();
        }
        previousSession.current = session;
    }, [session, authLoading]);
    
    // Automatically show CAPTCHA modal on the login screen, which then triggers the ToS modal.
    useEffect(() => {
        if (!session && !authLoading) {
            setShowCaptcha(true);
        }
    }, [session, authLoading]);
    
    // Effect to close popovers/dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
             if (tokenInfoRef.current && !tokenInfoRef.current.contains(event.target as Node)) {
                setIsTokenInfoOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchProjects = async () => {
        if (!session?.user) return;
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Error fetching projects:", error);
            setGeneralError(`Gagal mengambil data project: ${error.message}`);
            setProjects([]);
        } else {
            setProjects(data as Project[]);
        }
    };

    useEffect(() => {
        if (previousAppState.current !== appState) {
            playSound('transition');
            window.scrollTo(0, 0);
        }
        previousAppState.current = appState;
    }, [appState]);

    const navigateTo = (state: AppState) => {
        setAppState(state);
    };

    const handleNewProject = useCallback(async () => {
        if (!session?.user) return;
        setGeneralError(null);
        
        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: session.user.id, project_data: {}, status: 'in-progress' as ProjectStatus })
            .select()
            .single();
            
        if (error) {
            setGeneralError(`Gagal memulai project baru: ${error.message}`);
            return;
        }

        const newProject: Project = data as any;
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectId(newProject.id);
        clearWorkflowState();
        navigateTo('persona');
    }, [session]);
    
    const handleReturnToDashboard = useCallback(() => {
        clearWorkflowState();
        setSelectedProjectId(null);
        navigateTo('dashboard');
    }, []);

    const handleRequestReturnToDashboard = () => {
        if (appState === 'dashboard') {
            setIsUserMenuOpen(false);
            return;
        }
        setShowDashboardConfirm(true);
        setIsUserMenuOpen(false);
    };

    const confirmAndReturnToDashboard = () => {
        handleReturnToDashboard();
        setShowDashboardConfirm(false);
    };

    const handleSelectProject = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        setSelectedProjectId(projectId);
        
        if (project.status === 'in-progress') {
            saveWorkflowState(project.project_data); // Load DB data into local session for in-progress projects
            // Determine the next step based on what data exists
            const data = project.project_data;
            let nextState: AppState = 'persona';
            if (data.printMediaAssets) nextState = 'summary'; // Should not happen for in-progress
            else if (data.selectedPackagingUrl) nextState = 'print_media';
            else if (data.socialAds) nextState = 'packaging';
            else if (data.socialProfiles) nextState = 'social_ads';
            else if (data.socialMediaKit) nextState = 'profile_optimizer';
            else if (data.contentCalendar) nextState = 'social_kit';
            else if (data.logoVariations) nextState = 'content';
            else if (data.selectedLogoUrl) nextState = 'logo_detail';
            else if (data.selectedPersona) nextState = 'logo';
            
            navigateTo(nextState);
        } else {
            // For completed or local-complete, always go to summary
            navigateTo('summary');
        }
    }, [projects]);

    const handleGoToCaptionGenerator = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            saveWorkflowState(project.project_data); // Use workflow state for caption generator too
            setSelectedProjectId(project.id);
            navigateTo('caption');
        }
    }, [projects]);
    
    const handleGoToInstantContent = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            saveWorkflowState(project.project_data);
            setSelectedProjectId(project.id);
            navigateTo('instant_content');
        }
    }, [projects]);

    const handleReturnToSummary = useCallback(() => {
        // Does not clear workflow state
        if (selectedProjectId) {
             navigateTo('summary');
        } else {
            handleReturnToDashboard();
        }
    }, [selectedProjectId, handleReturnToDashboard]);

    // --- Project Deletion Handlers ---
    const handleRequestDeleteProject = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setProjectToDelete(project);
            setShowDeleteConfirm(true);
        }
    }, [projects]);

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete || !user) return;

        setIsDeleting(true);
        setGeneralError(null);

        try {
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectToDelete.id);
            
            if (deleteError) throw new Error(`Gagal menghapus data project: ${deleteError.message}`);

            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            if (selectedProjectId === projectToDelete.id) {
                handleReturnToDashboard(); // Go to dashboard if the deleted project was the active one
            }
            playSound('success');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus project.';
            setGeneralError(errorMessage);
            playSound('error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setProjectToDelete(null);
        }
    };
    
    // --- Centralized Local Checkpoint Saver ---
    const saveLocalCheckpoint = useCallback((updatedData: Partial<ProjectData>) => {
        saveWorkflowState(updatedData);
        showToast("Progres tersimpan sementara di browser!");
    }, [showToast]);


    // --- Workflow Step Completion Handlers (Now use local checkpoint) ---
    const handlePersonaComplete = useCallback(async (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData: Partial<ProjectData> = { ...currentState, brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan };
        saveLocalCheckpoint(updatedData);
        navigateTo('logo');
    }, [saveLocalCheckpoint]);
    
    const handleLogoComplete = useCallback(async (data: { logoBase64: string; prompt: string }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt };
        saveLocalCheckpoint(updatedData);
        navigateTo('logo_detail');
    }, [saveLocalCheckpoint]);

    const handleLogoDetailComplete = useCallback(async (data: { finalLogoUrl: string; variations: LogoVariations }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations };
        saveLocalCheckpoint(updatedData);
        navigateTo('content');
    }, [saveLocalCheckpoint]);

    const handleContentComplete = useCallback(async (data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, contentCalendar: data.calendar, searchSources: data.sources };
        saveLocalCheckpoint(updatedData);
        navigateTo('social_kit');
    }, [saveLocalCheckpoint]);

    const handleSocialKitComplete = useCallback(async (data: { assets: SocialMediaKitAssets }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, socialMediaKit: data.assets };
        saveLocalCheckpoint(updatedData);
        navigateTo('profile_optimizer');
    }, [saveLocalCheckpoint]);

    const handleProfileOptimizerComplete = useCallback(async (data: { profiles: SocialProfileData }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, socialProfiles: data.profiles };
        saveLocalCheckpoint(updatedData);
        navigateTo('social_ads');
    }, [saveLocalCheckpoint]);

    const handleSocialAdsComplete = useCallback(async (data: { adsData: SocialAdsData }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, socialAds: data.adsData };
        saveLocalCheckpoint(updatedData);
        navigateTo('packaging');
    }, [saveLocalCheckpoint]);

    const handlePackagingComplete = useCallback(async (packagingBase64: string) => {
       const currentState = loadWorkflowState() || {};
       const updatedData = { ...currentState, selectedPackagingUrl: packagingBase64 };
       saveLocalCheckpoint(updatedData);
       navigateTo('print_media');
    }, [saveLocalCheckpoint]);

    const handlePrintMediaComplete = useCallback(async (printMediaAssets: PrintMediaAssets) => {
        if (!session?.user || !selectedProjectId) return;
        
        setIsFinalizing(true);
        setGeneralError(null);
        
        try {
            const currentState = loadWorkflowState() || {};
            const finalProjectData = { ...currentState, printMediaAssets };

            const { data, error } = await supabase
                .from('projects')
                .update({ project_data: finalProjectData, status: 'local-complete' as ProjectStatus })
                .eq('id', selectedProjectId)
                .select()
                .single();

            if (error) throw error;

            const updatedProject: Project = data as any;
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            clearWorkflowState();
            setSelectedProjectId(null);
            navigateTo('dashboard');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat finalisasi project.';
            setGeneralError(errorMessage);
            playSound('error');
        } finally {
            setIsFinalizing(false);
        }

    }, [session, selectedProjectId]);

    const handleSyncProject = useCallback(async (projectId: number) => {
        if (!session?.user) return;
        const projectToSync = projects.find(p => p.id === projectId);
        if (!projectToSync) {
            setGeneralError("Project yang mau disinkronkan tidak ditemukan.");
            return;
        }

        setSyncingProjectId(projectId);
        setGeneralError(null);
        playSound('start');

        try {
            const newDataWithUrls = await uploadAndSyncProjectAssets(projectToSync);

            const { data, error } = await supabase
                .from('projects')
                .update({ project_data: newDataWithUrls, status: 'completed' as ProjectStatus })
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;

            const updatedProject: Project = data as any;
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            playSound('success');
            showToast("Project berhasil disinkronkan ke database!");

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat sinkronisasi.';
            setGeneralError(errorMessage);
            playSound('error');
        } finally {
            setSyncingProjectId(null);
        }
    }, [session, projects, showToast]);


    const openContactModal = useCallback(() => { playSound('click'); setShowContactModal(true); }, []);
    const closeContactModal = useCallback(() => setShowContactModal(false), []);
    const openToSModal = useCallback(() => { playSound('click'); setShowToSModal(true); }, []);
    const closeToSModal = useCallback(() => {
        setShowToSModal(false);
    }, []);
    const openProfileModal = useCallback(() => { playSound('click'); setIsUserMenuOpen(false); setShowProfileModal(true); }, []);
    const closeProfileModal = useCallback(() => setShowProfileModal(false), []);
    
    const handleGoogleLogin = async () => {
        playSound('click');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setGeneralError(`Gagal login: ${error.message}`);
          playSound('error');
        }
    };
    
    const executeLogout = async () => {
        clearWorkflowState();
        sessionStorage.removeItem('logoku_app_state');
        sessionStorage.removeItem('logoku_project_id');
        await authExecuteLogout();
        setAppState('dashboard');
        setSelectedProjectId(null);
    };

    const renderContent = () => {
        const workflowData = loadWorkflowState();
        const commonErrorProps = { onGoToDashboard: handleReturnToDashboard };

        switch (appState) {
            case 'persona':
                return <BrandPersonaGenerator onComplete={handlePersonaComplete} {...commonErrorProps} />;
            case 'logo':
                if (workflowData?.selectedPersona && workflowData.brandInputs) {
                    return <LogoGenerator 
                        persona={workflowData.selectedPersona} 
                        businessName={workflowData.brandInputs.businessName} 
                        onComplete={handleLogoComplete} 
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'logo_detail':
                if (workflowData?.selectedLogoUrl && workflowData.logoPrompt && workflowData.brandInputs) {
                    return <LogoDetailGenerator 
                        baseLogoUrl={workflowData.selectedLogoUrl} 
                        basePrompt={workflowData.logoPrompt} 
                        businessName={workflowData.brandInputs.businessName}
                        onComplete={handleLogoDetailComplete}
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'content':
                if (workflowData?.brandInputs && workflowData.selectedPersona) {
                    return <ContentCalendarGenerator
                        projectData={workflowData}
                        onComplete={handleContentComplete}
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'social_kit':
                if (workflowData?.brandInputs && workflowData.selectedPersona && workflowData.selectedLogoUrl && workflowData.selectedSlogan) {
                    return <SocialMediaKitGenerator 
                        projectData={workflowData as any} 
                        onComplete={handleSocialKitComplete} 
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'profile_optimizer':
                if (workflowData?.brandInputs && workflowData.selectedPersona) {
                    return <ProfileOptimizer projectData={workflowData} onComplete={handleProfileOptimizerComplete} {...commonErrorProps} />;
                }
                break;
            case 'social_ads':
                 if (workflowData?.brandInputs && workflowData.selectedPersona && workflowData.selectedSlogan) {
                    return <SocialAdsGenerator projectData={workflowData} onComplete={handleSocialAdsComplete} {...commonErrorProps} />;
                }
                break;
            case 'packaging':
                if (workflowData?.selectedPersona && workflowData.brandInputs && workflowData.selectedLogoUrl) {
                    return <PackagingGenerator 
                        projectData={workflowData}
                        onComplete={handlePackagingComplete} 
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'print_media':
                if (workflowData?.selectedLogoUrl && workflowData.brandInputs && workflowData.selectedPersona) {
                    return <PrintMediaGenerator
                        projectData={workflowData}
                        onComplete={handlePrintMediaComplete} 
                        isFinalizing={isFinalizing}
                        {...commonErrorProps}
                    />;
                }
                break;
            case 'summary':
                const projectToShow = projects.find(p => p.id === selectedProjectId);
                if (projectToShow) {
                    return <ProjectSummary 
                        project={projectToShow} 
                        onStartNew={handleReturnToDashboard} 
                        onGoToCaptionGenerator={handleGoToCaptionGenerator}
                        onGoToInstantContent={handleGoToInstantContent}
                        onDeleteProject={handleRequestDeleteProject}
                        onSyncProject={handleSyncProject}
                        syncingProjectId={syncingProjectId}
                    />;
                }
                break;
            case 'caption':
                if (workflowData && selectedProjectId) {
                    return <CaptionGenerator projectData={workflowData} onBack={handleReturnToSummary} {...commonErrorProps} />;
                }
                break;
            case 'instant_content':
                if (workflowData && selectedProjectId) {
                    return <InstantContentGenerator projectData={workflowData} onBack={handleReturnToSummary} {...commonErrorProps} />;
                }
                break;
            case 'dashboard':
            default:
                return <ProjectDashboard 
                    projects={projects} 
                    onNewProject={handleNewProject} 
                    onSelectProject={handleSelectProject} 
                    showWelcomeBanner={showWelcomeBanner} 
                    onWelcomeBannerClose={() => setShowWelcomeBanner(false)} 
                    onDeleteProject={handleRequestDeleteProject}
                />;
        }
        // Fallback: If required data is missing, go to dashboard
        handleReturnToDashboard();
        return <AuthLoadingScreen />;
    };
    
    if (authLoading) return <AuthLoadingScreen />;
    
    if (!session) {
        return (
            <>
                <LoginScreen onGoogleLogin={handleGoogleLogin} isCaptchaSolved={!showCaptcha} onShowToS={openToSModal} />
                <Suspense fallback={null}>
                    <PuzzleCaptchaModal
                        show={showCaptcha}
                        onSuccess={() => {
                            setShowCaptcha(false);
                        }}
                    />
                    <TermsOfServiceModal show={showToSModal} onClose={closeToSModal} />
                </Suspense>
            </>
        );
    }
    
    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-3 px-4 md:py-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center relative">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer" onClick={handleReturnToDashboard}>
                            <span>logo<span className="text-white">.ku</span></span>
                        </h1>
                        <div className="font-handwritten text-lg md:text-2xl text-indigo-300 cursor-pointer hover:text-white transition-colors" onClick={openContactModal}>
                            by @rangga.p.h
                        </div>
                    </div>
                     <div className="flex items-center gap-4 relative">
                        <img
                            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                            alt="Mang AI peeking from behind the token display"
                            className="animate-header-ai-peek w-12 h-12"
                        />
                        <div className="relative" ref={tokenInfoRef}>
                            <div
                                onClick={() => setIsTokenInfoOpen(prev => !prev)}
                                className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full text-yellow-400 cursor-pointer hover:bg-gray-700/70 transition-colors"
                                title="Klik untuk info token"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                <span className="font-bold text-sm text-white">Sisa Token: {profile?.credits ?? 0}</span>
                            </div>
                             {isTokenInfoOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-3 z-20 text-xs animate-content-fade-in" style={{ animationDuration: '0.2s'}}>
                                    <p className="font-bold text-white mb-1">Info Token Harian</p>
                                    <p className="text-gray-300">Ini adalah "amunisi" Mang AI buat generate gambar. Jatah lo bakal di-reset jadi 10 token setiap hari. Selamat berkarya!</p>
                                </div>
                            )}
                        </div>
                         <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setIsUserMenuOpen(prev => !prev)} title="User Menu" className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 rounded-full">
                                <img src={session.user.user_metadata.avatar_url} alt={session.user.user_metadata.full_name} className="w-9 h-9 rounded-full" />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20 animate-content-fade-in" style={{ animationDuration: '0.2s'}}>
                                    <button onClick={handleRequestReturnToDashboard} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1H5zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2zM5 9a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H5zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2z" clipRule="evenodd" /></svg>
                                        <span>Dashboard</span>
                                    </button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={openProfileModal} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                                        <span>Pengaturan Akun</span>
                                    </button>
                                     <a 
                                        href="https://saweria.co/logoku"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => { playSound('click'); setIsUserMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                        title="Suka aplikasi ini? Traktir Mang AI kopi!"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                        <span>Traktir Kopi</span>
                                    </a>
                                     <div className="border-t border-gray-700 my-1"></div>
                                        <div className="px-4 pt-1 pb-1 text-xs text-gray-400">Pilih Musik</div>
                                        <div className="px-2 pb-2">
                                            <select
                                                aria-label="Pilih musik latar"
                                                value={bgmSelection}
                                                onChange={(e) => handleBgmChange(e.target.value as BgmSelection)}
                                                className="w-full text-left px-2 py-1.5 text-sm text-gray-200 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="Mute">Bisukan BGM</option>
                                                <option value="Random">Acak</option>
                                                <option value="Jingle">Jingle</option>
                                                <option value="Acoustic">Akustik</option>
                                                <option value="Uplifting">Semangat</option>
                                                <option value="LoFi">Lo-Fi</option>
                                                <option value="Bamboo">Bambu</option>
                                                <option value="Ethnic">Etnik</option>
                                                <option value="Cozy">Santai</option>
                                            </select>
                                        </div>
                                    <button onClick={() => { handleToggleMute(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        {isMuted ? (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg><span>Suara Aktif</span></>
                                        ) : (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span>Bisukan</span></>
                                        )}
                                    </button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                     <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main id="main-content" className="py-6 md:py-10 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    {authError && <ErrorMessage message={authError} onGoToDashboard={handleReturnToDashboard} />}
                    {generalError ? (
                        <ErrorMessage message={`Terjadi error kritis yang tak terduga: ${generalError}`} onGoToDashboard={handleReturnToDashboard} />
                    ) : (
                        <ErrorBoundary onReset={handleReturnToDashboard}>
                            {showStepper && <ProgressStepper currentStep={currentStepIndex} />}
                            <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><LoadingMessage /></div>}>
                                <div key={appState} className="animate-content-fade-in">{renderContent()}</div>
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </div>
            </main>
             <footer className="text-center py-6 px-4 text-sm text-gray-400 border-t border-gray-800">
                Powered by Atharrazka Core. Built for UMKM Indonesia.
            </footer>
            <AdBanner />
            <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
            <Suspense fallback={null}>
                <ContactModal show={showContactModal} onClose={closeContactModal} />
                <TermsOfServiceModal show={showToSModal} onClose={closeToSModal} />
                <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
                <ProfileSettingsModal 
                    show={showProfileModal} 
                    onClose={closeProfileModal}
                    user={user}
                    profile={profile}
                    onLogout={handleLogout}
                    onDeleteAccount={handleDeleteAccount}
                    onShowToS={openToSModal}
                    onShowContact={openContactModal}
                />
                <ConfirmationModal
                    show={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={executeLogout}
                    title="Eh, Bentar Dulu, Juragan!"
                    confirmText="Ya, Cabut Aja"
                    cancelText="Gak Jadi, Balik Lagi"
                >
                    Kalo lo logout sekarang, progres project yang lagi jalan (yang cuma kesimpen di browser) bakal ilang lho. Sayang kan kalo ide brilian lo ngawang gitu aja. Tetep mau lanjut?
                </ConfirmationModal>
                 <ConfirmationModal
                    show={showDashboardConfirm}
                    onClose={() => setShowDashboardConfirm(false)}
                    onConfirm={confirmAndReturnToDashboard}
                    title="Kembali ke Dashboard?"
                    confirmText="Ya, Kembali Saja"
                    cancelText="Gak Jadi"
                >
                    Progres yang belum disimpan di tahap ini bakal hilang lho. Yakin mau kembali ke dashboard?
                </ConfirmationModal>
                <DeleteProjectSliderModal
                    show={showDeleteConfirm}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    isConfirmLoading={isDeleting}
                    projectNameToDelete={projectToDelete?.project_data.brandInputs?.businessName || 'Project Ini'}
                />
            </Suspense>
        </div>
    );
};

export default App;