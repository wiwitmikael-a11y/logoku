import React, { useState, useEffect, useCallback } from 'react';
import type { Project, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, PrintMediaAssets } from './types';

// Import all components
import ProjectDashboard from './components/ProjectDashboard';
import BrandPersonaGenerator from './components/BrandPersonaGenerator';
import LogoGenerator from './components/LogoGenerator';
import LogoDetailGenerator from './components/LogoDetailGenerator';
import ContentCalendarGenerator from './components/ContentCalendarGenerator';
import PrintMediaGenerator from './components/PrintMediaGenerator';
import PackagingGenerator from './components/PackagingGenerator';
import MerchandiseGenerator from './components/MerchandiseGenerator';
import ProjectSummary from './components/ProjectSummary';
import AdBanner from './components/AdBanner';

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'print' | 'packaging' | 'merchandise' | 'summary';

const App: React.FC = () => {
    // State management
    const [appState, setAppState] = useState<AppState>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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
        try {
            localStorage.setItem('brandingProjects', JSON.stringify(projects));
        } catch (error) {
            console.error("Failed to save projects to localStorage", error);
        }
    }, [projects]);

    // Handlers for flow
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

    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-6 px-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer flex items-baseline" onClick={handleStartNewFromSummary}>
                        <span>logo<span className="text-white">.ku</span></span>
                        <span className="ml-3 text-3xl text-gray-300 font-handwritten">by @rangga.p.h</span>
                    </h1>
                     <p className="text-gray-400 hidden md:block">Your Personal AI Branding Studio</p>
                </div>
            </header>
            <main className="py-10 px-4 md:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
             <footer className="text-center py-6 px-4 text-sm text-gray-500 border-t border-gray-800">
                Powered by Atharrazka Core. Built for UMKM Indonesia.
            </footer>
            <AdBanner />
        </div>
    );
};

export default App;