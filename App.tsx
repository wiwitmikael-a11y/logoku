// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase, supabaseError } from './services/supabaseClient';
import { saveWorkflowState, loadWorkflowState, clearWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandPersona, LogoVariations, SocialMediaKitAssets, SocialProfileData, PrintMediaAssets, ContentCalendarEntry, SocialAdsData } from './types';
import LoginScreen from './components/LoginScreen';
import BrandPersonaGenerator from './components/BrandPersonaGenerator';
import LogoGenerator from './components/LogoGenerator';
import LogoDetailGenerator from './components/LogoDetailGenerator';
import SocialMediaKitGenerator from './components/SocialMediaKitGenerator';
import ProfileOptimizer from './components/ProfileOptimizer';
import PackagingGenerator from './components/PackagingGenerator';
import PrintMediaGenerator from './components/PrintMediaGenerator';
import ContentCalendarGenerator from './components/ContentCalendarGenerator';
import SocialAdsGenerator from './components/SocialAdsGenerator';
import MerchandiseGenerator from './components/MerchandiseGenerator';
import Header from './components/Header';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import ProgressStepper from './components/common/ProgressStepper';
import PuzzleCaptchaModal from './components/common/PuzzleCaptchaModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AchievementToast from './components/gamification/AchievementToast';
import { compressAndConvertToWebP, isBase64DataUrl } from './utils/imageUtils';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy loading major components
const ProjectDashboard = lazy(() => import('./components/ProjectDashboard'));
const QuickTools = lazy(() => import('./components/QuickTools'));
const Forum = lazy(() => import('./components/Forum'));
const ContactModal = lazy(() => import('./components/common/ContactModal'));
const AboutModal = lazy(() => import('./components/common/AboutModal'));
const TermsOfServiceModal = lazy(() => import('./components/common/TermsOfServiceModal'));
const BrandGalleryModal = lazy(() => import('./components/BrandGalleryModal'));
const PusatJuraganModal = lazy(() => import('./components/gamification/PusatJuraganModal'));

const API_KEY = process.env.VITE_API_KEY;

export type AppView = 'DASHBOARD' | 'WIZARD' | 'QUICK_TOOLS' | 'FORUM';

const AppContent: React.FC = () => {
  const { session, user, profile, loading, grantAchievement, grantFirstStepXp, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement } = useAuth();
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<Partial<ProjectData>>({});
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(true);
  
  const [showToS, setShowToS] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPusatJuragan, setShowPusatJuragan] = useState(false);


  useEffect(() => {
    if (session) {
      setShowCaptcha(false);
      const savedState = loadWorkflowState();
      if (savedState && Object.keys(savedState).length > 0) {
        setProjectData(savedState);
        setView('WIZARD');
        // Determine current step based on saved data
        if (savedState.merchandiseUrl) setCurrentStep(9);
        else if (savedState.socialAds) setCurrentStep(9);
        else if (savedState.contentCalendar) setCurrentStep(8);
        else if (savedState.printMediaAssets) setCurrentStep(7);
        else if (savedState.selectedPackagingUrl) setCurrentStep(6);
        else if (savedState.socialProfiles) setCurrentStep(5);
        else if (savedState.socialMediaKit) setCurrentStep(4);
        else if (savedState.logoVariations) setCurrentStep(3);
        else if (savedState.selectedLogoUrl) setCurrentStep(2);
        else if (savedState.selectedPersona) setCurrentStep(1);
        else setCurrentStep(0);
      }
    } else {
        setShowCaptcha(true);
    }
  }, [session]);
  
  const handleStartNewProject = () => {
    clearWorkflowState();
    setProjectData({});
    setCurrentStep(0);
    setView('WIZARD');
    sessionStorage.setItem('onboardingStep2', 'true');
  };

  const handleGoToDashboard = () => {
    clearWorkflowState();
    setProjectData({});
    setView('DASHBOARD');
  };
  
  const handleNavigate = (targetView: AppView) => {
    if (view === 'WIZARD' && Object.keys(projectData).length > 0) {
        if (window.confirm("Lo lagi ngerjain project, nih. Yakin mau keluar dan kehilangan progres?")) {
            clearWorkflowState();
            setProjectData({});
            setView(targetView);
        }
    } else {
        setView(targetView);
    }
  };

  const updateProjectData = (newData: Partial<ProjectData>) => {
    const updatedData = { ...projectData, ...newData };
    setProjectData(updatedData);
    saveWorkflowState(updatedData);
  };

  const handleStep1Complete = (data: { inputs: any; selectedPersona: BrandPersona; selectedSlogan: string }) => {
    updateProjectData({ brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan });
    setCurrentStep(1);
    grantFirstStepXp('BRAND_PERSONA_COMPLETE');
  };

  const handleStep2Complete = (data: { logoBase64: string; prompt: string }) => {
    updateProjectData({ selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt });
    setCurrentStep(2);
    grantFirstStepXp('LOGO_GENERATED');
  };

  const handleStep3Complete = (data: { finalLogoUrl: string; variations: LogoVariations }) => {
    updateProjectData({ selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations });
    setCurrentStep(3);
  };

  const handleStep4Complete = (data: { assets: SocialMediaKitAssets }) => {
    updateProjectData({ socialMediaKit: data.assets });
    setCurrentStep(4);
    grantFirstStepXp('SOCIAL_KIT_GENERATED');
  };
  
  const handleStep5Complete = (data: { profiles: SocialProfileData }) => {
    updateProjectData({ socialProfiles: data.profiles });
    setCurrentStep(5);
  };

  const handleStep6Complete = (data: { packagingUrl: string }) => {
    updateProjectData({ selectedPackagingUrl: data.packagingUrl });
    setCurrentStep(6);
  };

  const handleStep7Complete = (data: { assets: PrintMediaAssets }) => {
    updateProjectData({ printMediaAssets: data.assets });
    setCurrentStep(7);
  };
  
  const handleStep8Complete = (data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
    updateProjectData({ contentCalendar: data.calendar, searchSources: data.sources });
    setCurrentStep(8);
    grantFirstStepXp('CONTENT_PLAN_GENERATED');
  };
  
  const handleStep9Complete = (data: { adsData: SocialAdsData }) => {
    updateProjectData({ socialAds: data.adsData });
    setCurrentStep(9);
  };
  
  const handleStep10Complete = async (merchandiseUrl: string) => {
    if (!user || !profile) return;
    
    // Final step: compress all images and save to DB
    const finalData = { ...projectData, merchandiseUrl } as ProjectData;
    
    // Show a loading/syncing screen here
    
    try {
      const compressionPromises: Promise<void>[] = [];
      const compress = async (url: string | undefined, key: keyof ProjectData) => {
        if (isBase64DataUrl(url)) {
          const webp = await compressAndConvertToWebP(url);
          (finalData as any)[key] = webp;
        }
      };

      const compressVariations = async (variations: LogoVariations | undefined) => {
        if (variations) {
          if (isBase64DataUrl(variations.main)) variations.main = await compressAndConvertToWebP(variations.main);
          if (isBase64DataUrl(variations.stacked)) variations.stacked = await compressAndConvertToWebP(variations.stacked);
          if (isBase64DataUrl(variations.horizontal)) variations.horizontal = await compressAndConvertToWebP(variations.horizontal);
          if (isBase64DataUrl(variations.monochrome)) variations.monochrome = await compressAndConvertToWebP(variations.monochrome);
        }
      };
      
      compressionPromises.push(compress(finalData.selectedLogoUrl, 'selectedLogoUrl'));
      compressionPromises.push(compress(finalData.selectedPackagingUrl, 'selectedPackagingUrl'));
      compressionPromises.push(compress(finalData.merchandiseUrl, 'merchandiseUrl'));
      compressionPromises.push(compressVariations(finalData.logoVariations));
      // ... and so on for all image assets
      
      await Promise.all(compressionPromises);

      const { error } = await supabase.from('projects').insert({
        user_id: user.id,
        project_data: finalData,
        status: 'completed'
      });
      if (error) throw error;
      
      const newTotalProjects = (profile.total_projects_completed ?? 0) + 1;
      const { error: profileUpdateError } = await supabase.from('profiles').update({ total_projects_completed: newTotalProjects }).eq('id', user.id);
      if (profileUpdateError) throw profileUpdateError;

      // Grant achievements based on total projects
      if (newTotalProjects === 1) await grantAchievement('BRAND_PERTAMA_LAHIR');
      if (newTotalProjects === 5) await grantAchievement('SANG_KOLEKTOR');
      if (newTotalProjects === 10) await grantAchievement('SULTAN_KONTEN');

      clearWorkflowState();
      setProjectData({});
      setView('DASHBOARD');
      
    } catch(err) {
        console.error("Error finalizing project:", err);
        alert(`Waduh, gagal nyimpen project: ${(err as Error).message}`);
    }
  };


  const renderWizardStep = () => {
    switch (currentStep) {
      case 0: return <BrandPersonaGenerator onComplete={handleStep1Complete} onGoToDashboard={handleGoToDashboard} />;
      case 1: return <LogoGenerator persona={projectData.selectedPersona!} businessName={projectData.brandInputs!.businessName} onComplete={handleStep2Complete} onGoToDashboard={handleGoToDashboard}/>;
      case 2: return <LogoDetailGenerator baseLogoUrl={projectData.selectedLogoUrl!} basePrompt={projectData.logoPrompt!} businessName={projectData.brandInputs!.businessName} onComplete={handleStep3Complete} onGoToDashboard={handleGoToDashboard}/>;
      case 3: return <SocialMediaKitGenerator projectData={projectData} onComplete={handleStep4Complete} onGoToDashboard={handleGoToDashboard}/>;
      case 4: return <ProfileOptimizer projectData={projectData} onComplete={handleStep5Complete} onGoToDashboard={handleGoToDashboard} />;
      case 5: return <PackagingGenerator projectData={projectData} onComplete={handleStep6Complete} onGoToDashboard={handleGoToDashboard} />;
      case 6: return <PrintMediaGenerator projectData={projectData} onComplete={handleStep7Complete} onGoToDashboard={handleGoToDashboard} />;
      case 7: return <ContentCalendarGenerator projectData={projectData} onComplete={handleStep8Complete} onGoToDashboard={handleGoToDashboard} />;
      case 8: return <SocialAdsGenerator projectData={projectData} onComplete={handleStep9Complete} onGoToDashboard={handleGoToDashboard} />;
      case 9: return <MerchandiseGenerator projectData={projectData} onComplete={handleStep10Complete} onGoToDashboard={handleGoToDashboard} />;
      default: return <p>Invalid Step</p>;
    }
  };

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return <Suspense fallback={<AuthLoadingScreen />}><ProjectDashboard onStartNewProject={handleStartNewProject} /></Suspense>;
      case 'WIZARD': return <div className="max-w-7xl mx-auto w-full"><ProgressStepper currentStep={currentStep} />{renderWizardStep()}</div>;
      case 'QUICK_TOOLS': return <Suspense fallback={<AuthLoadingScreen />}><QuickTools /></Suspense>;
      case 'FORUM': return <Suspense fallback={<AuthLoadingScreen />}><Forum /></Suspense>;
      default: return <Suspense fallback={<AuthLoadingScreen />}><ProjectDashboard onStartNewProject={handleStartNewProject} /></Suspense>;
    }
  };
  
  if (loading) { return <AuthLoadingScreen />; }

  if (!session) {
    return (
        <>
            <PuzzleCaptchaModal show={showCaptcha && !isCaptchaSolved} onSuccess={() => setIsCaptchaSolved(true)} />
            <LoginScreen onGoogleLogin={() => supabase.auth.signInWithOAuth({ provider: 'google' })} isCaptchaSolved={isCaptchaSolved} onShowToS={() => setShowToS(true)} />
            <Suspense fallback={null}>{showToS && <TermsOfServiceModal show={showToS} onClose={() => setShowToS(false)} />}</Suspense>
        </>
    );
  }

  return (
    <>
      <Header 
        onNavigate={handleNavigate} 
        currentView={view} 
        onShowAbout={() => setShowAbout(true)} 
        onShowContact={() => setShowContact(true)}
        onShowGallery={() => setShowGallery(true)}
        onShowPusatJuragan={() => setShowPusatJuragan(true)}
        onShowToS={() => setShowToS(true)}
      />
      <main id="main-content" className="flex-grow container mx-auto px-4 py-8 md:py-12 transition-all duration-300">
        {renderView()}
      </main>
      <footer className="w-full text-center p-4 text-xs text-text-muted">
        © 2024 Atharrazka Core by Rangga.P.H. Dirakit sepenuh hati ditemani Mang AI.
      </footer>
      <Suspense fallback={null}>
        {showLevelUpModal && <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />}
        {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onClose={() => setUnlockedAchievement(null)} />}
        {showToS && <TermsOfServiceModal show={showToS} onClose={() => setShowToS(false)} />}
        {showContact && <ContactModal show={showContact} onClose={() => setShowContact(false)} />}
        {showAbout && <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />}
        {showGallery && <BrandGalleryModal show={showGallery} onClose={() => setShowGallery(false)} />}
        {showPusatJuragan && <PusatJuraganModal show={showPusatJuragan} onClose={() => setShowPusatJuragan(false)} />}
      </Suspense>
    </>
  );
};


const App: React.FC = () => {
  if (!API_KEY) { return <ApiKeyErrorScreen />; }
  if (supabaseError) { return <SupabaseKeyErrorScreen error={supabaseError} />; }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
};

export default App;