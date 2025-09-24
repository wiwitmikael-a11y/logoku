import React, { useState, useEffect, Suspense } from 'react';
import { supabase, supabaseError } from './services/supabaseClient';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { saveWorkflowState, loadWorkflowState, clearWorkflowState } from './services/workflowPersistence';
import type { ProjectData, ContentCalendarEntry, BrandInputs, BrandPersona, LogoVariations, PrintMediaAssets, Project } from './types';
import Button from './components/common/Button';

// Dynamically import components for better performance
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const MerchandiseGenerator = React.lazy(() => import('./components/MerchandiseGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const ContactModal = React.lazy(() => import('./components/ContactModal'));
const AdBanner = React.lazy(() => import('./components/AdBanner'));

import ProgressStepper from './components/common/ProgressStepper';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
};

// Main app logic component that uses the Auth context
const MainApp: React.FC = () => {
  const { session, loading, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showToS, setShowToS] = useState(false);
  const [showContact, setShowContact] = useState(false);
  
  type AppState =
    | { view: 'dashboard' }
    | { view: 'workflow'; step: number; data: Partial<ProjectData> }
    | { view: 'summary'; project: Project }
    | { view: 'caption_generator', projectId: number };

  const [appState, setAppState] = useState<AppState>({ view: 'dashboard' });

  // Check for API key presence
  const apiKey = import.meta.env?.VITE_API_KEY;
  if (!apiKey) {
    return <ApiKeyErrorScreen />;
  }

  // Check for Supabase key error
  if (supabaseError) {
    return <SupabaseKeyErrorScreen error={supabaseError} />;
  }
  
  useEffect(() => {
    // Show welcome banner on first login of a session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (session && !hasSeenWelcome) {
      setShowWelcomeBanner(true);
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [session]);
  
  useEffect(() => {
    const fetchProjects = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) console.error("Error fetching projects:", error);
        else setProjects(data || []);
    };
    fetchProjects();
  }, [user]);

  // Workflow state management
  const updateWorkflowData = (newData: Partial<ProjectData>) => {
    if (appState.view === 'workflow') {
      const updatedData = { ...appState.data, ...newData };
      setAppState({ ...appState, data: updatedData });
      saveWorkflowState(updatedData);
    }
  };

  const nextStep = () => {
    if (appState.view === 'workflow') {
      setAppState({ ...appState, step: appState.step + 1 });
    }
  };
  
  const saveProject = async (projectData: ProjectData) => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: user.id, project_data: projectData })
            .select()
            .single();
        if (error) throw error;
        setProjects(prev => [data, ...prev]);
        setAppState({ view: 'summary', project: data });
        clearWorkflowState();
    } catch (error) {
        console.error("Failed to save project:", error);
        // TODO: show an error message to user
    }
  };
  
  const startNewProject = () => {
      clearWorkflowState();
      const persistedState = loadWorkflowState(); // should be null
      setAppState({ view: 'workflow', step: 0, data: persistedState || {} });
  };
  
  const handlePersonaComplete = (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
    updateWorkflowData({
      brandInputs: data.inputs,
      selectedPersona: data.selectedPersona,
      selectedSlogan: data.selectedSlogan
    });
    nextStep();
  };

  const handleLogoComplete = (data: { logoUrl: string; prompt: string }) => {
    updateWorkflowData({
      selectedLogoUrl: data.logoUrl,
      logoPrompt: data.prompt,
    });
    nextStep();
  };
  
  const handleLogoDetailComplete = (data: { finalLogoUrl: string; variations: LogoVariations }) => {
    updateWorkflowData({
        selectedLogoUrl: data.finalLogoUrl,
        logoVariations: data.variations
    });
    nextStep();
  };

  const handleContentCalendarComplete = (data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
    updateWorkflowData({
      contentCalendar: data.calendar,
      searchSources: data.sources,
    });
    nextStep();
  };

  const handlePrintMediaComplete = (data: { assets: PrintMediaAssets, inputs: Pick<BrandInputs, 'contactInfo' | 'flyerContent' | 'bannerContent' | 'rollBannerContent'> }) => {
      if (appState.view === 'workflow' && appState.data.brandInputs) {
          const updatedBrandInputs = { ...appState.data.brandInputs, ...data.inputs };
          updateWorkflowData({
              selectedPrintMedia: data.assets,
              brandInputs: updatedBrandInputs as BrandInputs
          });
          nextStep();
      }
  };

  const handlePackagingComplete = (packagingUrl: string) => {
      updateWorkflowData({ selectedPackagingUrl: packagingUrl });
      nextStep();
  };

  const handleMerchandiseComplete = (merchandiseUrl: string) => {
      if (appState.view === 'workflow' && appState.data) {
          const finalData = { ...appState.data, selectedMerchandiseUrl: merchandiseUrl } as ProjectData;
          saveProject(finalData);
      }
  };
  
  const handleGoToCaptionGenerator = (projectId: number) => {
      setAppState({ view: 'caption_generator', projectId });
  };

  const handleSelectProject = (projectId: number) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          setAppState({ view: 'summary', project });
      }
  };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return (
      <Suspense fallback={<AuthLoadingScreen />}>
        <LoginScreen onShowToS={() => setShowToS(true)} />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (appState.view) {
      case 'dashboard':
        return (
          <ProjectDashboard
            projects={projects}
            onNewProject={startNewProject}
            onSelectProject={handleSelectProject}
            onGoToCaptionGenerator={handleGoToCaptionGenerator}
            showWelcomeBanner={showWelcomeBanner}
            onWelcomeBannerClose={() => setShowWelcomeBanner(false)}
          />
        );
      case 'workflow':
        const { step, data } = appState;
        switch (step) {
          case 0:
            return <BrandPersonaGenerator onComplete={handlePersonaComplete} />;
          case 1:
            if (!data.selectedPersona || !data.brandInputs) return <p>Error: Missing persona data.</p>;
            return <LogoGenerator persona={data.selectedPersona} businessName={data.brandInputs.businessName} onComplete={handleLogoComplete} />;
          case 2:
            if (!data.selectedLogoUrl || !data.logoPrompt) return <p>Error: Missing logo data.</p>;
            return <LogoDetailGenerator baseLogoUrl={data.selectedLogoUrl} basePrompt={data.logoPrompt} onComplete={handleLogoDetailComplete} />;
          case 3:
            return <ContentCalendarGenerator projectData={data} onComplete={handleContentCalendarComplete} />;
          case 4:
            return <PrintMediaGenerator projectData={data} onComplete={handlePrintMediaComplete} />;
          case 5:
            if (!data.selectedPersona || !data.brandInputs) return <p>Error: Missing persona data.</p>;
            return <PackagingGenerator persona={data.selectedPersona} businessName={data.brandInputs.businessName} onComplete={handlePackagingComplete} />;
          case 6:
            if (!data.logoPrompt || !data.brandInputs) return <p>Error: Missing project data.</p>;
            return <MerchandiseGenerator logoPrompt={data.logoPrompt} businessName={data.brandInputs.businessName} onComplete={handleMerchandiseComplete} />;
          default:
            setAppState({ view: 'dashboard' }); // Reset to dashboard on invalid step
            return null;
        }
      case 'summary':
        return <ProjectSummary project={appState.project} onStartNew={startNewProject} />;
      case 'caption_generator':
        const project = projects.find(p => p.id === appState.projectId);
        if (!project) return <p>Project not found.</p>;
        return <CaptionGenerator projectData={project.project_data} onBack={() => setAppState({ view: 'dashboard' })} />;
      default:
        return <p>Invalid state</p>;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans pb-24">
      <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <div 
          onClick={() => setAppState({ view: 'dashboard' })} 
          className="text-2xl font-bold tracking-tighter text-indigo-400 cursor-pointer"
        >
          logo<span className="text-white">.ku</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowContact(true)} className="text-sm text-gray-400 hover:text-white transition-colors">
            Kontak
          </button>
          <Button onClick={() => supabase.auth.signOut()} variant="secondary" size="small">
            Logout
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        {appState.view === 'workflow' && <ProgressStepper currentStep={appState.step} />}
        <Suspense fallback={<AuthLoadingScreen />}>
          {renderContent()}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <TermsOfServiceModal show={showToS} onClose={() => setShowToS(false)} />
        <ContactModal show={showContact} onClose={() => setShowContact(false)} />
        <AdBanner />
      </Suspense>
    </div>
  );
};

export default App;