
import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { supabase, supabaseError } from './services/supabaseClient';
import { playSound, playBGM, stopBGM } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, PrintMediaAssets, SeoData, AdsData } from './types';
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

// --- Lazily Loaded Components ---
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const SeoGenerator = React.lazy(() => import('./components/SeoGenerator'));
const GoogleAdsGenerator = React.lazy(() => import('./components/GoogleAdsGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const MerchandiseGenerator = React.lazy(() => import('./components/MerchandiseGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const ContactModal = React.lazy(() => import('./components/ContactModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const ConfirmationModal = React.lazy(() => import('./components/common/ConfirmationModal'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));


type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'print' | 'seo' | 'ads' | 'packaging' | 'merchandise' | 'summary' | 'caption';
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
        executeLogout,
        handleDeleteAccount, 
        handleToggleMute, 
        isMuted, 
        authError,
        refreshProfile,
        bgmSelection,
        handleBgmChange,
    } = useAuth();
    
    const [appState, setAppState] = useState<AppState>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    
    // State for the welcome banner
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    
    // Modals visibility state
    const [showContactModal, setShowContactModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false); // New state for CAPTCHA
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Dropdowns visibility state
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isTokenInfoOpen, setIsTokenInfoOpen] = useState(false);

    // Refs for closing popovers on outside click
    const userMenuRef = useRef<HTMLDivElement>(null);
    const tokenInfoRef = useRef<HTMLDivElement>(null);
    
    const previousAppState = useRef<AppState>(appState);
    const previousSession = useRef<typeof session>(session);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'content', 'print', 'seo', 'ads', 'packaging', 'merchandise'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;

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
            .insert({ user_id: session.user.id, project_data: {}, status: 'in-progress' })
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

    const handleSelectProject = useCallback((projectId: number) => {
        setSelectedProjectId(projectId);
        navigateTo('summary');
    }, []);
    
    const handleContinueProject = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        setSelectedProjectId(project.id);
        saveWorkflowState(project.project_data);
        
        // Determine the next step based on what data exists
        const data = project.project_data;
        let nextState: AppState = 'persona';
        if (data.selectedMerchandiseUrl) nextState = 'summary'; // Go to summary if it was completed
        else if (data.selectedPackagingUrl) nextState = 'merchandise';
        else if (data.adsData) nextState = 'packaging';
        else if (data.seoData) nextState = 'ads';
        else if (data.selectedPrintMedia) nextState = 'seo';
        else if (data.contentCalendar) nextState = 'print';
        else if (data.logoVariations) nextState = 'content';
        else if (data.selectedLogoUrl) nextState = 'logo_detail';
        else if (data.selectedPersona) nextState = 'logo';
        
        navigateTo(nextState);
    }, [projects]);

    const handleGoToCaptionGenerator = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            saveWorkflowState(project.project_data); // Use workflow state for caption generator too
            setSelectedProjectId(project.id);
            navigateTo('caption');
        }
    }, [projects]);

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
            // 1. Delete associated files from Supabase Storage
            const folderPath = `${user.id}/${projectToDelete.id}`;
            const { data: files, error: listError } = await supabase.storage
                .from('project-assets')
                .list(folderPath);

            if (listError) throw new Error(`Gagal membaca file project: ${listError.message}`);

            if (files && files.length > 0) {
                const filePaths = files.map(file => `${folderPath}/${file.name}`);
                const { error: removeError } = await supabase.storage
                    .from('project-assets')
                    .remove(filePaths);
                if (removeError) throw new Error(`Gagal menghapus aset project: ${removeError.message}`);
            }

            // 2. Delete the project record from the database
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectToDelete.id);
            
            if (deleteError) throw new Error(`Gagal menghapus data project: ${deleteError.message}`);

            // 3. Update UI state
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));

            // 4. Refresh user profile to get updated storage usage
            await refreshProfile();
            
            playSound('success'); // Or a dedicated delete sound

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
    
    // --- Centralized Checkpoint Saver ---
    const saveCheckpoint = useCallback(async (updatedData: Partial<ProjectData>) => {
        if (!selectedProjectId) {
            setGeneralError("ID Project tidak ditemukan untuk menyimpan progress.");
            throw new Error("ID Project tidak ditemukan.");
        }
        
        const { error } = await supabase
            .from('projects')
            .update({ project_data: updatedData })
            .eq('id', selectedProjectId);
            
        if (error) {
            setGeneralError(`Gagal menyimpan progress: ${error.message}`);
            throw new Error(error.message);
        }
        
        setProjects(prev => prev.map(p => 
            p.id === selectedProjectId ? { ...p, project_data: updatedData as ProjectData } : p
        ));
        
        saveWorkflowState(updatedData);
    }, [selectedProjectId]);

    // --- Workflow Step Completion Handlers (Refactored) ---
    const handlePersonaComplete = useCallback(async (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData: Partial<ProjectData> = {
            ...currentState, // Merge with current state to avoid data loss on re-edits
            brandInputs: data.inputs,
            selectedPersona: data.selectedPersona,
            selectedSlogan: data.selectedSlogan,
        };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('logo');
        } catch (e) { /* error is handled by saveCheckpoint */ }
    }, [saveCheckpoint]);
    
    const handleLogoComplete = useCallback(async (data: { logoUrl: string; prompt: string }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, selectedLogoUrl: data.logoUrl, logoPrompt: data.prompt };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('logo_detail');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handleLogoDetailComplete = useCallback(async (data: { finalLogoUrl: string; variations: LogoVariations }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('content');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handleContentComplete = useCallback(async (data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, contentCalendar: data.calendar, searchSources: data.sources };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('print');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handlePrintMediaComplete = useCallback(async (data: { assets: PrintMediaAssets, inputs: Pick<BrandInputs, 'contactInfo' | 'flyerContent' | 'bannerContent' | 'rollBannerContent'> }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = {
            ...currentState,
            selectedPrintMedia: data.assets,
            // FIX: Cast the merged object to BrandInputs to satisfy TypeScript.
            // This is safe because application logic ensures `currentState.brandInputs` exists at this stage.
            brandInputs: { ...(currentState.brandInputs || {}), ...data.inputs } as BrandInputs, // Safely merge brand inputs
        };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('seo');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handleSeoComplete = useCallback(async (data: { seoData: SeoData }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, seoData: data.seoData };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('ads');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handleAdsComplete = useCallback(async (data: { adsData: AdsData }) => {
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, adsData: data.adsData };
        try {
            await saveCheckpoint(updatedData);
            navigateTo('packaging');
        } catch (e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handlePackagingComplete = useCallback(async (packagingUrl: string) => {
       const currentState = loadWorkflowState() || {};
       const updatedData = { ...currentState, selectedPackagingUrl: packagingUrl };
       try {
            await saveCheckpoint(updatedData);
            navigateTo('merchandise');
       } catch(e) { /* error is handled */ }
    }, [saveCheckpoint]);

    const handleMerchandiseComplete = useCallback(async (merchandiseUrl: string) => {
        if (!session?.user || !selectedProjectId) return;
        
        const currentState = loadWorkflowState() || {}; // Use fallback to prevent crash
        const finalProjectData: ProjectData = {
            ...currentState,
            selectedMerchandiseUrl: merchandiseUrl,
        } as ProjectData;

        const { data, error } = await supabase
            .from('projects')
            .update({ project_data: finalProjectData, status: 'completed' })
            .eq('id', selectedProjectId)
            .select()
            .single();

        if (error) {
            console.error("Error saving final project", error);
            setGeneralError(`Gagal menyimpan project: ${error.message}`);
        } else {
            const updatedProject: Project = data as any;
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            setSelectedProjectId(updatedProject.id);
            clearWorkflowState();
            navigateTo('summary');
        }
    }, [session, selectedProjectId]);

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


    const renderContent = () => {
        const workflowData = loadWorkflowState();

        switch (appState) {
            case 'persona':
                return <BrandPersonaGenerator onComplete={handlePersonaComplete} />;
            case 'logo':
                if (workflowData?.selectedPersona && workflowData.brandInputs && selectedProjectId && session?.user?.id) {
                    return <LogoGenerator 
                        persona={workflowData.selectedPersona} 
                        businessName={workflowData.brandInputs.businessName} 
                        onComplete={handleLogoComplete} 
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'logo_detail':
                if (workflowData?.selectedLogoUrl && workflowData.logoPrompt && selectedProjectId && session?.user?.id) {
                    return <LogoDetailGenerator 
                        baseLogoUrl={workflowData.selectedLogoUrl} 
                        basePrompt={workflowData.logoPrompt} 
                        onComplete={handleLogoDetailComplete}
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'content':
                if (workflowData?.brandInputs && workflowData.selectedPersona && selectedProjectId && session?.user?.id) {
                    return <ContentCalendarGenerator
                        projectData={workflowData}
                        onComplete={handleContentComplete}
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'print':
                if (workflowData?.brandInputs && workflowData.selectedPersona && workflowData.logoPrompt && selectedProjectId && session?.user?.id) {
                    return <PrintMediaGenerator 
                        projectData={workflowData} 
                        onComplete={handlePrintMediaComplete} 
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'seo':
                if (workflowData?.brandInputs && workflowData.selectedPersona && workflowData.selectedLogoUrl) {
                    return <SeoGenerator projectData={workflowData} onComplete={handleSeoComplete} />;
                }
                break;
            case 'ads':
                if (workflowData?.brandInputs && workflowData.selectedSlogan) {
                    return <GoogleAdsGenerator projectData={workflowData} onComplete={handleAdsComplete} />;
                }
                break;
            case 'packaging':
                if (workflowData?.selectedPersona && workflowData.brandInputs && selectedProjectId && session?.user?.id) {
                    return <PackagingGenerator 
                        persona={workflowData.selectedPersona} 
                        businessName={workflowData.brandInputs.businessName} 
                        onComplete={handlePackagingComplete} 
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'merchandise':
                if (workflowData?.logoPrompt && workflowData.brandInputs?.businessName && selectedProjectId && session?.user?.id) {
                    return <MerchandiseGenerator 
                        logoPrompt={workflowData.logoPrompt} 
                        businessName={workflowData.brandInputs.businessName} 
                        onComplete={handleMerchandiseComplete} 
                        userId={session.user.id}
                        projectId={selectedProjectId}
                    />;
                }
                break;
            case 'summary':
                const projectToShow = projects.find(p => p.id === selectedProjectId);
                if (projectToShow) {
                    return <ProjectSummary project={projectToShow} onStartNew={handleReturnToDashboard} />;
                }
                break;
            case 'caption':
                if (workflowData) {
                    return <CaptionGenerator projectData={workflowData} onBack={handleReturnToDashboard} />;
                }
                break;
            case 'dashboard':
            default:
                return <ProjectDashboard projects={projects} onNewProject={handleNewProject} onSelectProject={handleSelectProject} onContinueProject={handleContinueProject} onGoToCaptionGenerator={handleGoToCaptionGenerator} showWelcomeBanner={showWelcomeBanner} onWelcomeBannerClose={() => setShowWelcomeBanner(false)} onDeleteProject={handleRequestDeleteProject} />;
        }
        // Fallback: If required data is missing, go to dashboard
        handleReturnToDashboard();
        return null;
    };
    
    if (authLoading) return <AuthLoadingScreen />;
    
    // Render Login screen, Captcha, and ToS modal if not logged in
    if (!session) {
        return (
            <>
                <LoginScreen onGoogleLogin={handleGoogleLogin} isCaptchaSolved={!showCaptcha} />
                <Suspense fallback={null}>
                    <PuzzleCaptchaModal
                        show={showCaptcha}
                        onSuccess={() => {
                            setShowCaptcha(false);
                            openToSModal(); // Show ToS after captcha is solved
                        }}
                    />
                    <TermsOfServiceModal show={showToSModal} onClose={closeToSModal} />
                </Suspense>
            </>
        );
    }
    
    // Render the main app for logged-in users
    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-3 px-4 md:py-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center relative">
                    <img
                        src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                        alt="Mang AI walking in the header"
                        className="animate-header-ai w-12 h-12"
                    />
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer" onClick={handleReturnToDashboard}>
                            <span>logo<span className="text-white">.ku</span></span>
                        </h1>
                        <div className="font-handwritten text-lg md:text-2xl text-indigo-300 cursor-pointer hover:text-white transition-colors" onClick={openContactModal}>
                            by @rangga.p.h
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
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
                                    <button onClick={openProfileModal} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                                        <span>Pengaturan Akun</span>
                                    </button>
                                    <button onClick={() => { handleToggleMute(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        {isMuted ? (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg><span>Suara Aktif</span></>
                                        ) : (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg><span>Bisukan</span></>
                                        )}
                                    </button>
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
            <main className="py-6 md:py-10 px-4 md:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
                    {authError && <ErrorMessage message={authError} />}
                    {generalError ? (
                        <ErrorMessage message={`Terjadi error kritis yang tak terduga: ${generalError}`} />
                    ) : (
                        <ErrorBoundary>
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
                    Kalo lo logout sekarang, progres yang belom ke-save otomatis (checkpoint) bisa ilang lho. Sayang kan kalo ide brilian lo ngawang gitu aja. Tetep mau lanjut?
                </ConfirmationModal>
                <ConfirmationModal
                    show={showDeleteConfirm}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    isConfirmLoading={isDeleting}
                    title="Yakin Mau Hapus Project?"
                    confirmText={isDeleting ? 'Menghapus...' : 'Ya, Hapus Saja'}
                    cancelText="Gak Jadi"
                >
                    Project "{projectToDelete?.project_data.brandInputs?.businessName || 'ini'}" dan semua asetnya bakal dihapus permanen lho. Gak bisa balik lagi. Tetap mau lanjut?
                </ConfirmationModal>
            </Suspense>
        </div>
    );
};

export default App;
