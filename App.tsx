
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase, supabaseError } from './services/supabaseClient';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { saveWorkflowState, loadWorkflowState, clearWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandPersona, BrandInputs, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets } from './types';
import { playSound, playRandomBGM, stopBGM } from './services/soundService';

// --- Component Imports ---
import LoginScreen from './components/LoginScreen';
import ProjectDashboard from './components/ProjectDashboard';
import BrandPersonaGenerator from './components/BrandPersonaGenerator';
import LogoGenerator from './components/LogoGenerator';
import LogoDetailGenerator from './components/LogoDetailGenerator';
import ContentCalendarGenerator from './components/ContentCalendarGenerator';
import SocialMediaKitGenerator from './components/SocialMediaKitGenerator';
import ProfileOptimizer from './components/ProfileOptimizer';
import SocialAdsGenerator from './components/SocialAdsGenerator';
import PackagingGenerator from './components/PackagingGenerator';
import PrintMediaGenerator from './components/PrintMediaGenerator';
import ProjectSummary from './components/ProjectSummary';
import CaptionGenerator from './components/CaptionGenerator';
import InstantContentGenerator from './components/InstantContentGenerator';
import ProgressStepper from './components/common/ProgressStepper';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import PuzzleCaptchaModal from './components/common/PuzzleCaptchaModal';
import Toast from './components/common/Toast';
import ConfirmationModal from './components/common/ConfirmationModal';

type View = 'dashboard' | 'workflow' | 'summary' | 'caption-generator' | 'instant-content';

const AppContent: React.FC = () => {
    const { session, loading, profile, refreshProfile } = useAuth();
    const [view, setView] = useState<View>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [workflowStep, setWorkflowStep] = useState(0);
    const [projectData, setProjectData] = useState<Partial<ProjectData>>({});
    const [isProjectsLoading, setIsProjectsLoading] = useState(false);
    const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!session?.user) return;
        setIsProjectsLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        
        if (error) console.error('Error fetching projects:', error);
        else setProjects(data || []);
        setIsProjectsLoading(false);
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchProjects();
            playRandomBGM();
        } else {
            stopBGM();
        }
    }, [session, fetchProjects]);
    
    useEffect(() => {
        if (session && localStorage.getItem('logoku_just_logged_in')) {
            setShowWelcomeBanner(true);
            localStorage.removeItem('logoku_just_logged_in');
        }
    }, [session]);

    const handleGoogleLogin = async () => {
        localStorage.setItem('logoku_just_logged_in', 'true');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) console.error("Error logging in with Google:", error);
    };

    const handleNewProject = async () => {
        if (!session?.user) return;
        playSound('transition');
        clearWorkflowState();
        setProjectData({ brandInputs: {} as BrandInputs });
        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: session.user.id, project_data: { brandInputs: {} }, status: 'in-progress' })
            .select()
            .single();

        if (error) {
            console.error('Error creating project', error);
        } else if (data) {
            setActiveProject(data);
            setWorkflowStep(0);
            setView('workflow');
        }
    };

    const handleSelectProject = (projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            playSound('transition');
            setActiveProject(project);
            setProjectData(project.project_data);
            
            // Determine which view to open
            if (project.status === 'completed' || project.status === 'local-complete') {
                setView('summary');
            } else {
                 // Determine workflow step based on data
                const data = project.project_data;
                let step = 0;
                if (data.selectedPersona && data.selectedSlogan) step = 1;
                if (data.selectedLogoUrl) step = 2;
                if (data.logoVariations) step = 3;
                if (data.contentCalendar) step = 4;
                if (data.socialMediaKit) step = 5;
                if (data.socialProfiles) step = 6;
                if (data.socialAds) step = 7;
                if (data.selectedPackagingUrl) step = 8;
                if (data.printMediaAssets) step = 9;

                setWorkflowStep(step);
                setView('workflow');
            }
        }
    };
    
    const handleDeleteProject = (projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
             setProjectToDelete(project);
        }
    };
    
    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsFinalizing(true); // Re-use for loading state
        
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
        
        if (error) {
            console.error("Error deleting project:", error.message);
            setToastMessage("Gagal menghapus project.");
        } else {
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            setToastMessage(`Project "${projectToDelete.project_data.brandInputs.businessName}" berhasil dihapus.`);
        }
        
        setShowToast(true);
        setProjectToDelete(null);
        setIsFinalizing(false);
    };

    const updateProjectData = useCallback(async (newData: Partial<ProjectData>, newStatus: 'in-progress' | 'local-complete' | 'completed' = 'in-progress') => {
        if (!activeProject) return;
        
        const updatedData = { ...projectData, ...newData };
        setProjectData(updatedData);

        const { data, error } = await supabase
            .from('projects')
            .update({ project_data: updatedData, status: newStatus })
            .eq('id', activeProject.id)
            .select()
            .single();

        if (error) {
            console.error('Failed to update project data:', error);
        } else if (data) {
            setActiveProject(data);
             // Also update the project in the main list
            setProjects(prevProjects => prevProjects.map(p => p.id === data.id ? data : p));
        }
    }, [activeProject, projectData]);

    const handleGoToDashboard = () => {
        playSound('transition');
        setView('dashboard');
        setActiveProject(null);
        clearWorkflowState();
        fetchProjects();
    };

    // --- Workflow Step Completion Handlers ---
    const onPersonaComplete = (data: { inputs: BrandInputs; allPersonas: BrandPersona[]; selectedPersona: BrandPersona; allSlogans: string[]; selectedSlogan: string }) => {
        const newData = { brandInputs: data.inputs, generatedPersonas: data.allPersonas, selectedPersona: data.selectedPersona, generatedSlogans: data.allSlogans, selectedSlogan: data.selectedSlogan };
        saveWorkflowState(newData);
        updateProjectData(newData);
        setWorkflowStep(1);
    };

    const onLogoComplete = (data: { allLogos: string[]; logoBase64: string; prompt: string }) => {
        const newData = { generatedLogoOptions: data.allLogos, selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(2);
    };
    
     const onLogoDetailComplete = (data: { finalLogoUrl: string; variations: LogoVariations }) => {
        const newData = { selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(3);
    };

    const onCalendarComplete = (data: { calendar: ContentCalendarEntry[]; sources: any[] }) => {
        const newData = { contentCalendar: data.calendar, searchSources: data.sources };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(4);
    };
    
    const onSocialKitComplete = (data: { assets: SocialMediaKitAssets }) => {
        const newData = { socialMediaKit: data.assets };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(5);
    };

    const onProfileOptimizeComplete = (data: { profiles: SocialProfileData }) => {
        const newData = { socialProfiles: data.profiles };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(6);
    };

    const onSocialAdsComplete = (data: { adsData: SocialAdsData }) => {
        const newData = { socialAds: data.adsData };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(7);
    };
    
    const onPackagingComplete = (packagingBase64: string) => {
        const newData = { selectedPackagingUrl: packagingBase64 };
        saveWorkflowState({ ...projectData, ...newData });
        updateProjectData(newData);
        setWorkflowStep(8);
    };
    
    const onPrintMediaComplete = async (assets: PrintMediaAssets) => {
        const newData = { printMediaAssets: assets };
        setIsFinalizing(true);
        await updateProjectData(newData, 'completed');
        clearWorkflowState();
        setIsFinalizing(false);
        playSound('success');
        setView('summary');
    };
    
    const onAuxiliaryContentGenerated = (data: any, type: 'caption' | 'instant') => {
        let history = type === 'caption' ? projectData.captionHistory || [] : projectData.instantContentHistory || [];
        history = [data, ...history].slice(0, 10); // Keep last 10
        const newData = type === 'caption' ? { captionHistory: history } : { instantContentHistory: history };
        updateProjectData(newData);
    };


    const renderWorkflowStep = () => {
        if (!activeProject) return null;
        switch (workflowStep) {
            case 0: return <BrandPersonaGenerator onComplete={onPersonaComplete} onGoToDashboard={handleGoToDashboard} />;
            case 1: return <LogoGenerator persona={projectData.selectedPersona!} businessName={projectData.brandInputs!.businessName} onComplete={onLogoComplete} onGoToDashboard={handleGoToDashboard} />;
            case 2: return <LogoDetailGenerator baseLogoUrl={projectData.selectedLogoUrl!} basePrompt={projectData.logoPrompt!} businessName={projectData.brandInputs!.businessName} onComplete={onLogoDetailComplete} onGoToDashboard={handleGoToDashboard} />;
            case 3: return <ContentCalendarGenerator projectData={projectData} onComplete={onCalendarComplete} onGoToDashboard={handleGoToDashboard} />;
            case 4: return <SocialMediaKitGenerator projectData={projectData} onComplete={onSocialKitComplete} onGoToDashboard={handleGoToDashboard} />;
            case 5: return <ProfileOptimizer projectData={projectData} onComplete={onProfileOptimizeComplete} onGoToDashboard={handleGoToDashboard} />;
            case 6: return <SocialAdsGenerator projectData={projectData} onComplete={onSocialAdsComplete} onGoToDashboard={handleGoToDashboard} />;
            case 7: return <PackagingGenerator projectData={projectData} onComplete={onPackagingComplete} onGoToDashboard={handleGoToDashboard} />;
            case 8: return <PrintMediaGenerator projectData={projectData} onComplete={onPrintMediaComplete} isFinalizing={isFinalizing} onGoToDashboard={handleGoToDashboard} />;
            default: return handleGoToDashboard();
        }
    };
    
    const renderCurrentView = () => {
        switch (view) {
            case 'workflow':
                return (
                    <>
                        <ProgressStepper currentStep={workflowStep} />
                        {renderWorkflowStep()}
                    </>
                );
            case 'summary':
                return <ProjectSummary 
                            projectData={projectData as ProjectData} 
                            onGoToDashboard={handleGoToDashboard}
                            onOpenCaptionGenerator={() => setView('caption-generator')}
                            onOpenInstantContent={() => setView('instant-content')}
                            onSyncComplete={async () => { await fetchProjects(); setToastMessage('Aset berhasil disinkronkan!'); setShowToast(true); }}
                            activeProject={activeProject!}
                        />;
            case 'caption-generator':
                 return <CaptionGenerator 
                            projectData={projectData} 
                            onBack={() => setView('summary')}
                            onGoToDashboard={handleGoToDashboard}
                            onCaptionsGenerated={(data) => onAuxiliaryContentGenerated(data, 'caption')}
                        />;
            case 'instant-content':
                return <InstantContentGenerator 
                            projectData={projectData} 
                            onBack={() => setView('summary')} 
                            onGoToDashboard={handleGoToDashboard}
                            onContentGenerated={(data) => onAuxiliaryContentGenerated(data, 'instant')}
                        />;
            case 'dashboard':
            default:
                return <ProjectDashboard 
                            projects={projects} 
                            onNewProject={handleNewProject} 
                            onSelectProject={handleSelectProject} 
                            showWelcomeBanner={showWelcomeBanner}
                            onWelcomeBannerClose={() => setShowWelcomeBanner(false)}
                            onDeleteProject={handleDeleteProject}
                        />;
        }
    };

    if (loading) return <AuthLoadingScreen />;

    if (!session) {
        return (
            <>
                <PuzzleCaptchaModal show={!isCaptchaSolved} onSuccess={() => setIsCaptchaSolved(true)} />
                <LoginScreen onGoogleLogin={handleGoogleLogin} isCaptchaSolved={isCaptchaSolved} onShowToS={() => { /* Implement if needed */ }} />
            </>
        );
    }
    
    return (
        <ErrorBoundary onReset={handleGoToDashboard}>
            <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                 {renderCurrentView()}
            </main>
            <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
            <ConfirmationModal
                show={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={confirmDeleteProject}
                title={`Yakin mau hapus "${projectToDelete?.project_data.brandInputs.businessName}"?`}
                confirmText="Ya, Hapus Permanen"
                cancelText="Gak Jadi Deh"
                isConfirmLoading={isFinalizing}
            >
                Ini akan menghapus semua data project secara permanen dan tidak bisa dibalikin lagi.
            </ConfirmationModal>
        </ErrorBoundary>
    );
};

const App: React.FC = () => {
    const geminiApiKey = import.meta.env?.VITE_API_KEY;
    
    if (!geminiApiKey) return <ApiKeyErrorScreen />;
    if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
