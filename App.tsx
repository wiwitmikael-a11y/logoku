import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import type { Project, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, PrintMediaAssets } from './types';
import { playSound, playBGM, stopBGM, toggleMuteBGM, unlockAudio } from './services/soundService';

// Statically import initial/common components
import WelcomeScreen from './components/WelcomeScreen';
import AdBanner from './components/AdBanner';
import LoadingMessage from './components/common/LoadingMessage';
import ProgressStepper from './components/common/ProgressStepper';

// Dynamically import main screen components for code-splitting
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const MerchandiseGenerator = React.lazy(() => import('./components/MerchandiseGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const ContactModal = React.lazy(() => import('./components/ContactModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'print' | 'packaging' | 'merchandise' | 'summary';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

// Component untuk menampilkan error jika API Key tidak ada
const ApiKeyErrorScreen = () => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-red-900/50 backdrop-blur-md border border-red-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI character looking confused"
                className="w-32 absolute -top-20 filter grayscale drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)]"
                style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="text-3xl font-extrabold text-red-400 tracking-tighter mb-4 mt-8">
                Waduh, Mang AI Lagi Mogok Kerja!
            </h1>
            <div className="text-red-200 space-y-4 max-w-lg mb-6">
                <p>
                    Mang AI lagi ngambek nih, katanya jatah <strong className="text-white">udud sama kopi itemnya</strong> belom turun dari yang punya aplikasi.
                </p>
                <p>
                    Otaknya jadi nge-freeze, gak bisa mikir buat bikinin logo apalagi ngasih ide konten buat lo.
                </p>
                <div className="bg-gray-800/50 p-4 rounded-lg text-sm mt-4">
                    <p className="font-bold text-white">
                        Coba colek yang punya aplikasi ini, bilangin "Mang AI nagih jatah, Bos!". Biar dia cepet-cepet ngasih 'amunisi'-nya lagi.
                    </p>
                </div>
            </div>
             <p className="text-xs text-red-300">
                Nanti kalo ududnya udah ngebul, Mang AI siap gaskeun lagi!
             </p>
        </div>
    </div>
);


const App: React.FC = () => {
    // State management
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [appState, setAppState] = useState<AppState>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const previousAppState = useRef<AppState>(appState);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'content', 'print', 'packaging', 'merchandise'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;


    // Cek API Key saat aplikasi pertama kali dimuat
    useEffect(() => {
        // Check for API key in both Vite's `import.meta.env` and standard `process.env`.
        // This provides robustness across different build/deployment environments.
        const apiKey = (import.meta as any)?.env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env.VITE_API_KEY);

        if (!apiKey) {
            // The UI component provides clear instructions, so a console error is not needed.
            setApiKeyMissing(true);
        }
    }, []);

    // Play transition sound when app state changes
    useEffect(() => {
        if (previousAppState.current !== appState && !showWelcome) {
            playSound('transition');
        }
        previousAppState.current = appState;
    }, [appState, showWelcome]);


    // Load projects from localStorage on mount
    useEffect(() => {
        try {
            const savedProjects = localStorage.getItem('brandingProjects');
            if (savedProjects) {
                const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
                    ...p,
                    createdAt: new Date(p.createdAt) // Make sure date is a Date object
                }));
                setProjects(parsedProjects);
            }
        } catch (error) {
            console.error("Failed to load projects from localStorage", error);
        }
    }, []);

    // Save projects to localStorage whenever they change
    useEffect(() => {
        // Don't save if we are still on the welcome screen
        if (showWelcome) return;
        try {
            localStorage.setItem('brandingProjects', JSON.stringify(projects));
        } catch (error) {
            console.error("Failed to save projects to localStorage", error);
        }
    }, [projects, showWelcome]);

    // Handlers for flow
    const handleEnterApp = useCallback(() => {
        playSound('success'); // Play a success sound on entering the app
        setShowWelcome(false);
        stopBGM();
        playBGM('main');
    }, []);

    const handleNewProject = useCallback(() => {
        setCurrentProject({});
        setAppState('persona');
        setSelectedProjectId(null);
    }, []);

    const handleSelectProject = useCallback((projectId: string) => {
        setSelectedProjectId(projectId);
        setAppState('summary');
    }, []);

    const handlePersonaComplete = useCallback((data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        setCurrentProject({
            brandInputs: data.inputs,
            selectedPersona: data.selectedPersona,
            selectedSlogan: data.selectedSlogan,
        });
        setAppState('logo');
    }, []);
    
    const handleLogoComplete = useCallback((data: { logoUrl: string; prompt: string }) => {
        setCurrentProject(prev => ({
            ...prev,
            selectedLogoUrl: data.logoUrl,
            logoPrompt: data.prompt,
        }));
        setAppState('logo_detail');
    }, []);

    const handleLogoDetailComplete = useCallback((data: { finalLogoUrl: string; variations: LogoVariations }) => {
        setCurrentProject(prev => ({
            ...prev,
            selectedLogoUrl: data.finalLogoUrl,
            logoVariations: data.variations,
        }));
        setAppState('content');
    }, []);

    const handleContentComplete = useCallback((data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
        setCurrentProject(prev => ({
            ...prev,
            contentCalendar: data.calendar,
            searchSources: data.sources,
        }));
        setAppState('print');
    }, []);

    const handlePrintMediaComplete = useCallback((data: { assets: PrintMediaAssets, inputs: Pick<BrandInputs, 'contactInfo' | 'flyerContent' | 'bannerContent' | 'rollBannerContent'> }) => {
        setCurrentProject(prev => ({
            ...prev,
            selectedPrintMedia: data.assets,
            brandInputs: { ...prev!.brandInputs!, ...data.inputs },
        }));
        setAppState('packaging');
    }, []);

    const handlePackagingComplete = useCallback((packagingUrl: string) => {
       setCurrentProject(prev => ({
            ...prev,
            selectedPackagingUrl: packagingUrl,
        }));
        setAppState('merchandise');
    }, []);

    const handleMerchandiseComplete = useCallback((merchandiseUrl: string) => {
        const newProject: Project = {
            ...currentProject,
            selectedMerchandiseUrl: merchandiseUrl,
            id: new Date().toISOString(),
            createdAt: new Date(),
        } as Project;

        setProjects(prev => [...prev, newProject]);
        setCurrentProject(newProject);
        setSelectedProjectId(newProject.id);
        setAppState('summary');
    }, [currentProject]);
    
    const handleStartNewFromSummary = useCallback(() => {
        setCurrentProject(null);
        setSelectedProjectId(null);
        setAppState('dashboard');
    }, []);

    const handleToggleMute = useCallback(() => {
        const isNowPlaying = toggleMuteBGM();
        setIsMuted(!isNowPlaying);
    }, []);
    
    const openContactModal = useCallback(async () => {
        await unlockAudio();
        playSound('click');
        setShowContactModal(true);
    }, []);
    const closeContactModal = useCallback(() => setShowContactModal(false), []);

    const openToSModal = useCallback(() => {
        playSound('click');
        setShowToSModal(true)
    }, []);
    const closeToSModal = useCallback(() => setShowToSModal(false), []);


    // Render logic
    const renderContent = () => {
        switch (appState) {
            case 'persona':
                return <BrandPersonaGenerator onComplete={handlePersonaComplete} />;
            case 'logo':
                if (currentProject?.selectedPersona && currentProject.brandInputs) {
                    return <LogoGenerator persona={currentProject.selectedPersona} businessName={currentProject.brandInputs.businessName} onComplete={handleLogoComplete} />;
                }
                break;
            case 'logo_detail':
                if (currentProject?.selectedLogoUrl && currentProject.logoPrompt) {
                    return <LogoDetailGenerator baseLogoUrl={currentProject.selectedLogoUrl} basePrompt={currentProject.logoPrompt} onComplete={handleLogoDetailComplete} />;
                }
                break;
            case 'content':
                if (currentProject) {
                    return <ContentCalendarGenerator projectData={currentProject} onComplete={handleContentComplete} />;
                }
                break;
            case 'print':
                if (currentProject) {
                    const projectForPrint: Project = {
                        id: 'temp', createdAt: new Date(), ...currentProject
                    } as Project;
                    if (projectForPrint.brandInputs && projectForPrint.selectedPersona && projectForPrint.logoPrompt) {
                       return <PrintMediaGenerator projectData={projectForPrint} onComplete={handlePrintMediaComplete} />;
                    }
                }
                break;
            case 'packaging':
                if (currentProject?.selectedPersona && currentProject.brandInputs) {
                    return <PackagingGenerator persona={currentProject.selectedPersona} businessName={currentProject.brandInputs.businessName} onComplete={handlePackagingComplete} />;
                }
                break;
            case 'merchandise':
                if (currentProject?.logoPrompt && currentProject.brandInputs?.businessName) {
                    return <MerchandiseGenerator logoPrompt={currentProject.logoPrompt} businessName={currentProject.brandInputs.businessName} onComplete={handleMerchandiseComplete} />;
                }
                break;
            case 'summary':
                const projectToShow = projects.find(p => p.id === selectedProjectId) || currentProject as Project;
                if (projectToShow) {
                    return <ProjectSummary project={projectToShow} onStartNew={handleStartNewFromSummary} />;
                }
                break;
            case 'dashboard':
            default:
                return <ProjectDashboard projects={projects} onNewProject={handleNewProject} onSelectProject={handleSelectProject} />;
        }
        // Fallback for invalid state transitions
        handleStartNewFromSummary();
        return null;
    };
    
    if (apiKeyMissing) {
        return <ApiKeyErrorScreen />;
    }

    if (showWelcome) {
        return (
            <>
                <WelcomeScreen onEnter={handleEnterApp} onShowToS={openToSModal} />
                <Suspense fallback={null}>
                    <TermsOfServiceModal show={showToSModal} onClose={closeToSModal} />
                </Suspense>
            </>
        );
    }

    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-6 px-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer flex items-baseline" onClick={handleStartNewFromSummary}>
                        <span>logo<span className="text-white">.ku</span></span>
                        <span className="ml-3 text-lg text-gray-400 font-handwritten">by @rangga.p.h</span>
                    </h1>
                     <div className="flex items-center gap-4">
                        <button onClick={openContactModal} title="Info Kontak" className="text-gray-400 hover:text-white transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button onClick={handleToggleMute} title={isMuted ? "Suara Aktif" : "Bisukan Musik"} className="text-gray-400 hover:text-white transition-colors">
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                            )}
                        </button>
                        <img 
                            src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                            alt="Animated Mang AI character"
                            className="h-8 relative animate-header-ai"
                        />
                    </div>
                </div>
            </header>
            <main className="py-10 px-4 md:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
                     {showStepper && <ProgressStepper currentStep={currentStepIndex} />}
                    <Suspense fallback={
                        <div className="flex justify-center items-center min-h-[50vh]">
                            <LoadingMessage />
                        </div>
                    }>
                        <div key={appState} className="animate-content-fade-in">
                            {renderContent()}
                        </div>
                    </Suspense>
                </div>
            </main>
             <footer className="text-center py-6 px-4 text-sm text-gray-400 border-t border-gray-800">
                Powered by Atharrazka Core. Built for UMKM Indonesia.
            </footer>
            <AdBanner />
            <Suspense fallback={null}>
                <ContactModal show={showContactModal} onClose={closeContactModal} />
            </Suspense>
        </div>
    );
};

export default App;