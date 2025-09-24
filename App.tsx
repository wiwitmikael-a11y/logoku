import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, PrintMediaAssets, User, Profile } from './types';
import { playSound, playBGM, stopBGM, toggleMuteBGM } from './services/soundService';
import { supabase, supabaseError } from './services/supabaseClient';

// Statically import initial/common components
import AdBanner from './components/AdBanner';
import LoadingMessage from './components/common/LoadingMessage';
import ProgressStepper from './components/common/ProgressStepper';
import LoginScreen from './components/LoginScreen';
import AuthLoadingScreen from './components/common/AuthLoadingScreen';
import ErrorMessage from './components/common/ErrorMessage';

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
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));

type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content' | 'print' | 'packaging' | 'merchandise' | 'summary';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';
const INITIAL_CREDITS = 10;

const ApiKeyErrorScreen = () => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
        {/* ... (Error screen content remains the same) ... */}
    </div>
);

const SupabaseKeyErrorScreen = ({ error }: { error: string }) => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-red-900/50 border border-red-700 p-8 rounded-lg flex flex-col items-center gap-4">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI looking confused"
                className="w-24 h-24 object-contain filter grayscale opacity-80"
                style={{ imageRendering: 'pixelated' }}
            />
            <div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Kesalahan Konfigurasi Supabase</h2>
                <p className="text-red-200">{error}</p>
                <p className="text-gray-400 mt-4 text-sm">Pastikan kamu sudah mengatur environment variable di Vercel dan melakukan deploy ulang ya.</p>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    // Immediately check for Supabase configuration errors. If they exist, stop rendering the app.
    if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
    
    // After the check, we can safely assert that supabase is not null for the rest of the component.
    const supabaseClient = supabase!;

    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [appState, setAppState] = useState<AppState>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectData, setCurrentProjectData] = useState<Partial<ProjectData> | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const previousAppState = useRef<AppState>(appState);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'content', 'print', 'packaging', 'merchandise'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;

    useEffect(() => {
        // Standardize API Key check to match geminiService
        const apiKey = process.env.API_KEY;
        if (!apiKey) setApiKeyMissing(true);
    }, []);

    useEffect(() => {
        setAuthLoading(true);

        supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            if (session) {
                try {
                    await fetchUserData(session.user);
                } catch (e) {
                    console.error("FATAL: Error during initial user data fetch:", e);
                    setGeneralError((e as Error).message);
                }
            }
            setAuthLoading(false);
        }).catch(err => {
            console.error("FATAL: getSession promise rejected:", err);
            setGeneralError((err as Error).message);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
            setGeneralError(null); // Clear previous errors on auth change
            setSession(session);
            if (session) {
                try {
                    await fetchUserData(session.user);
                    stopBGM();
                    playBGM('main');
                } catch (e) {
                    console.error("FATAL: Error during auth state change user data fetch:", e);
                    setGeneralError((e as Error).message);
                }
            } else {
                setUserProfile(null);
                setProjects([]);
                stopBGM();
                playBGM('welcome');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserData = async (user: User) => {
        // 1. Try to fetch the profile.
        let { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // 2. If profile is not found (PGRST116), create it.
        if (!profile || (profileError && profileError.code === 'PGRST116')) {
            console.warn('Profile not found for new user, creating one.');
            const today = new Date().toISOString().split('T')[0];
            const newUserProfile: Profile = { 
                id: user.id,
                credits: INITIAL_CREDITS,
                last_credit_reset: today,
            };

            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert(newUserProfile);
            
            if (insertError) {
                console.error("CRITICAL: Failed to create user profile in database:", insertError);
                throw new Error(`Gagal membuat profil pengguna: ${insertError.message}`);
            }
            // If insert succeeded, assign our locally created profile object.
            profile = newUserProfile;
        } else if (profileError) {
            // A different, unexpected error occurred fetching the profile.
            console.error("Unexpected error fetching profile:", profileError);
            throw new Error(`Gagal mengambil data profil: ${profileError?.message || 'Unknown error'}`);
        }
        
        // 3. Handle daily credit reset for existing users.
        const today = new Date().toISOString().split('T')[0];
        if (profile && profile.last_credit_reset !== today) {
            const { data: updatedProfile, error: updateError } = await supabaseClient
                .from('profiles')
                .update({ credits: INITIAL_CREDITS, last_credit_reset: today })
                .eq('id', user.id)
                .select()
                .single();
            if (updateError) {
                console.error("Error resetting credits:", updateError);
                // Don't block flow, just log the error. The user will have old credits.
            } else {
                profile = updatedProfile;
            }
        }
        
        // At this point, `profile` must be valid.
        setUserProfile(profile);

        // 4. Fetch user's projects.
        const { data: userProjects, error: projectsError } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            setProjects([]);
        } else {
            setProjects(userProjects as Project[]);
        }
    };

    useEffect(() => {
        if (previousAppState.current !== appState) {
            playSound('transition');
        }
        previousAppState.current = appState;
    }, [appState]);

    const handleCreditDeduction = useCallback(async (cost: number): Promise<boolean> => {
        if (!userProfile || userProfile.credits < cost) {
            playSound('error');
            setShowOutOfCreditsModal(true);
            return false;
        }

        const newCredits = userProfile.credits - cost;
        const { error } = await supabaseClient
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userProfile.id);

        if (error) {
            console.error("Error deducting credits:", error);
            playSound('error');
            return false;
        } else {
            setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
            return true;
        }
    }, [userProfile, supabaseClient]);

    const handleNewProject = useCallback(() => {
        setCurrentProjectData({});
        setAppState('persona');
        setSelectedProjectId(null);
    }, []);

    const handleSelectProject = useCallback((projectId: number) => {
        setSelectedProjectId(projectId);
        setAppState('summary');
    }, []);

    const handlePersonaComplete = useCallback((data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        setCurrentProjectData({
            brandInputs: data.inputs,
            selectedPersona: data.selectedPersona,
            selectedSlogan: data.selectedSlogan,
        });
        setAppState('logo');
    }, []);
    
    const handleLogoComplete = useCallback((data: { logoUrl: string; prompt: string }) => {
        setCurrentProjectData(prev => ({ ...prev, selectedLogoUrl: data.logoUrl, logoPrompt: data.prompt }));
        setAppState('logo_detail');
    }, []);

    const handleLogoDetailComplete = useCallback((data: { finalLogoUrl: string; variations: LogoVariations }) => {
        setCurrentProjectData(prev => ({ ...prev, selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations }));
        setAppState('content');
    }, []);

    const handleContentComplete = useCallback((data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
        setCurrentProjectData(prev => ({ ...prev, contentCalendar: data.calendar, searchSources: data.sources }));
        setAppState('print');
    }, []);

    const handlePrintMediaComplete = useCallback((data: { assets: PrintMediaAssets, inputs: Pick<BrandInputs, 'contactInfo' | 'flyerContent' | 'bannerContent' | 'rollBannerContent'> }) => {
        setCurrentProjectData(prev => ({
            ...prev,
            selectedPrintMedia: data.assets,
            brandInputs: { ...prev!.brandInputs!, ...data.inputs },
        }));
        setAppState('packaging');
    }, []);

    const handlePackagingComplete = useCallback((packagingUrl: string) => {
       setCurrentProjectData(prev => ({ ...prev, selectedPackagingUrl: packagingUrl }));
        setAppState('merchandise');
    }, []);

    const handleMerchandiseComplete = useCallback(async (merchandiseUrl: string) => {
        if (!session?.user) return;
        
        const finalProjectData: ProjectData = {
            ...currentProjectData,
            selectedMerchandiseUrl: merchandiseUrl,
        } as ProjectData;

        const { data, error } = await supabaseClient
            .from('projects')
            .insert({ user_id: session.user.id, project_data: finalProjectData })
            .select()
            .single();

        if (error) {
            console.error("Error saving project", error);
        } else {
            const newProject: Project = data as any;
            setProjects(prev => [newProject, ...prev]);
            setSelectedProjectId(newProject.id);
            setAppState('summary');
        }
    }, [currentProjectData, session, supabaseClient]);
    
    const handleStartNewFromSummary = useCallback(() => {
        setCurrentProjectData(null);
        setSelectedProjectId(null);
        setAppState('dashboard');
    }, []);
    
    const handleLogout = async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error('Error logging out:', error);
    };

    const handleToggleMute = useCallback(() => setIsMuted(!toggleMuteBGM()), []);
    const openContactModal = useCallback(() => { playSound('click'); setShowContactModal(true); }, []);
    const closeContactModal = useCallback(() => setShowContactModal(false), []);
    const openToSModal = useCallback(() => { playSound('click'); setShowToSModal(true); }, []);
    const closeToSModal = useCallback(() => setShowToSModal(false), []);

    const renderContent = () => {
        const credits = userProfile?.credits ?? 0;
        const commonImageProps = { credits, onDeductCredits: handleCreditDeduction };
        
        switch (appState) {
            case 'persona':
                return <BrandPersonaGenerator onComplete={handlePersonaComplete} />;
            case 'logo':
                if (currentProjectData?.selectedPersona && currentProjectData.brandInputs) {
                    return <LogoGenerator persona={currentProjectData.selectedPersona} businessName={currentProjectData.brandInputs.businessName} onComplete={handleLogoComplete} {...commonImageProps} />;
                }
                break;
            case 'logo_detail':
                if (currentProjectData?.selectedLogoUrl && currentProjectData.logoPrompt) {
                    return <LogoDetailGenerator baseLogoUrl={currentProjectData.selectedLogoUrl} basePrompt={currentProjectData.logoPrompt} onComplete={handleLogoDetailComplete} {...commonImageProps} />;
                }
                break;
            case 'content':
                 if (currentProjectData?.brandInputs && currentProjectData.selectedPersona) {
                    return <ContentCalendarGenerator projectData={currentProjectData} onComplete={handleContentComplete} />;
                }
                break;
            case 'print':
                if (currentProjectData?.brandInputs && currentProjectData.selectedPersona && currentProjectData.logoPrompt) {
                    return <PrintMediaGenerator projectData={currentProjectData} onComplete={handlePrintMediaComplete} {...commonImageProps} />;
                }
                break;
            case 'packaging':
                if (currentProjectData?.selectedPersona && currentProjectData.brandInputs) {
                    return <PackagingGenerator persona={currentProjectData.selectedPersona} businessName={currentProjectData.brandInputs.businessName} onComplete={handlePackagingComplete} {...commonImageProps} />;
                }
                break;
            case 'merchandise':
                if (currentProjectData?.logoPrompt && currentProjectData.brandInputs?.businessName) {
                    return <MerchandiseGenerator logoPrompt={currentProjectData.logoPrompt} businessName={currentProjectData.brandInputs.businessName} onComplete={handleMerchandiseComplete} {...commonImageProps} />;
                }
                break;
            case 'summary':
                const projectToShow = projects.find(p => p.id === selectedProjectId);
                if (projectToShow) {
                    return <ProjectSummary project={projectToShow} onStartNew={handleStartNewFromSummary} />;
                }
                break;
            case 'dashboard':
            default:
                return <ProjectDashboard projects={projects} user={session?.user} onNewProject={handleNewProject} onSelectProject={handleSelectProject} />;
        }
        handleStartNewFromSummary();
        return null;
    };
    
    if (apiKeyMissing) return <ApiKeyErrorScreen />;
    if (authLoading) return <AuthLoadingScreen />;
    if (!session) return <LoginScreen onShowToS={openToSModal} />;

    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-4 px-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer flex items-baseline" onClick={handleStartNewFromSummary}>
                        <span>logo<span className="text-white">.ku</span></span>
                    </h1>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-full text-yellow-400" title="Kredit Generate Gambar Harian">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            <span className="font-bold text-sm text-white">{userProfile?.credits ?? 0}</span>
                        </div>
                        <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                        <button onClick={handleToggleMute} title={isMuted ? "Suara Aktif" : "Bisukan Musik"} className="text-gray-400 hover:text-white transition-colors">
                            {isMuted ? '🔊' : '🔇'}
                        </button>
                        <img src={session.user.user_metadata.avatar_url} alt={session.user.user_metadata.full_name} className="w-8 h-8 rounded-full" />
                    </div>
                </div>
            </header>
            <main className="py-10 px-4 md:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
                    {generalError ? (
                        <ErrorMessage message={`Terjadi error kritis yang tak terduga: ${generalError}`} />
                    ) : (
                        <>
                            {showStepper && <ProgressStepper currentStep={currentStepIndex} />}
                            <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><LoadingMessage /></div>}>
                                <div key={appState} className="animate-content-fade-in">{renderContent()}</div>
                            </Suspense>
                        </>
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
            </Suspense>
        </div>
    );
};

export default App;
