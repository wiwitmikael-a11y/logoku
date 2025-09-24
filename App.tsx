
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import type { Project, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, PrintMediaAssets } from './types';
import { playSound } from './services/soundService';

// Statically import initial/common components
import WelcomeScreen from './components/WelcomeScreen';
import AdBanner from './components/AdBanner';
import LoadingMessage from './components/common/LoadingMessage';

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

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'print' | 'packaging' | 'merchandise' | 'summary';

const GITHUB_ASSETS_URL = 'https://raw.githubusercontent.com/wiwitmikael-a11y/logoku-assets/main/';

// Component untuk menampilkan error jika API Key tidak ada
const ApiKeyErrorScreen = () => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-red-900/50 backdrop-blur-md border border-red-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI character looking confused"
                className="w-24 absolute -top-16 filter grayscale"
                style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="text-3xl font-extrabold text-red-400 tracking-tighter mb-4">
                Waduh, Kunci API Mang AI Gak Ketemu!
            </h1>
            <div className="text-red-200 space-y-4 max-w-lg mb-6 text-left">
                <p>
                    Tenang, ini masalah umum di project Vite. Environment Variable di Vercel <strong>wajib diawali `VITE_`</strong> biar bisa dibaca sama aplikasi.
                </p>
                <div className="bg-gray-800/50 p-4 rounded-lg text-sm">
                    <h2 className="font-bold text-white mb-2">Cara Ngebenerinnya di Vercel:</h2>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Buka Vercel Dashboard &gt; Project <strong>logo.ku</strong> kamu.</li>
                        <li>Masuk ke tab <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</li>
                        <li>
                           Edit variable yang sudah ada, atau buat yang baru:
                           <ul className="list-disc list-inside ml-4 mt-1 bg-gray-900 p-2 rounded">
                               <li>Name: <code className="bg-red-500 text-white px-1 rounded">VITE_API_KEY</code> (PENTING: Ganti dari `API_KEY` jadi ini)</li>
                               <li>Value: <code className="bg-gray-700 px-1 rounded">[API Key Google AI Studio lo]</code></li>
                           </ul>
                        </li>
                        <li><strong>PENTING:</strong> Pastikan semua environment (Production, Preview, Development) dicentang.</li>
                        <li>Klik <strong>Save</strong>, lalu deploy ulang project lo dari menu <strong>Deployments</strong> &gt; Redeploy.</li>
                    </ol>
                </div>
            </div>
             <p className="text-xs text-red-300">
                Setelah di-set dan deploy ulang, refresh halaman ini.
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
        return <WelcomeScreen onEnter={handleEnterApp} />;
    }

    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-6 px-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer flex items-baseline" onClick={handleStartNewFromSummary}>
                        <span>logo<span className="text-white">.ku</span></span>
                        <span className="ml-3 text-lg text-gray-400 font-handwritten">by @rangga.p.h</span>
                    </h1>
                    <img 
                        src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                        alt="Animated Mang AI character"
                        className="h-8 relative animate-header-ai mr-8"
                    />
                </div>
            </header>
            <main className="py-10 px-4 md:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
                    <Suspense fallback={
                        <div className="flex justify-center items-center min-h-[50vh]">
                            <LoadingMessage />
                        </div>
                    }>
                        {renderContent()}
                    </Suspense>
                </div>
            </main>
             <footer className="text-center py-6 px-4 text-sm text-gray-400 border-t border-gray-800">
                Powered by Atharrazka Core. Built for UMKM Indonesia.
            </footer>
            <AdBanner />
        </div>
    );
};

export default App;
