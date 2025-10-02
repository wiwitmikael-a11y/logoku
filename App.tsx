// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { supabase, supabaseError } from './services/supabaseClient';
import { playSound, playBGM, stopBGM } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import { uploadImageFromBase64 } from './services/storageService';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus } from './types';
import { AuthProvider, useAuth, BgmSelection } from './contexts/AuthContext';

// --- API Services ---
import * as geminiService from './services/geminiService';
import { fetchImageAsBase64 } from './utils/imageUtils';


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
import Toast from './components/common/Toast';

// --- Lazily Loaded Components ---
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const InstantContentGenerator = React.lazy(() => import('./components/InstantContentGenerator'));
const ContactModal = React.lazy(() => import('./components/ContactModal'));
const AboutModal = React.lazy(() => import('./components/common/AboutModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const ConfirmationModal = React.lazy(() => import('./components/common/ConfirmationModal'));
const DeleteProjectSliderModal = React.lazy(() => import('./components/common/DeleteProjectSliderModal'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));
const ProFeatureModal = React.lazy(() => import('./components/common/ProFeatureModal')); // NEW
// NEW: Import all generator components for the wizard
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const SocialMediaKitGenerator = React.lazy(() => import('./components/SocialMediaKitGenerator'));
const ProfileOptimizer = React.lazy(() => import('./components/ProfileOptimizer'));
const SocialAdsGenerator = React.lazy(() => import('./components/SocialAdsGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const SyncProgressScreen = React.lazy(() => import('./components/SyncProgressScreen'));


type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'content_calendar' | 'social_kit' | 'profiles' | 'social_ads' | 'packaging' | 'print_media' | 'summary' | 'caption' | 'instant_content' | 'sync_progress';
const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

// --- NEW: AI Assistant Component ---
const AiAssistant: React.FC = () => {
    const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
             setMessages([{ role: 'model', text: "Sore, Juragan! Mang AI siap bantu. Ada yang bisa dibantuin soal branding atau fitur di aplikasi ini?" }]);
        }
    }, [isOpen, messages.length]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Set new height up to max
        }
    }, [input]);

    const togglePanel = () => setIsOpen(prev => !prev);

    const handleSendMessage = async (e?: React.FormEvent, prompt?: string) => {
        e?.preventDefault();
        const messageText = (prompt || input).trim();
        if (!messageText || isLoading) return;
        
        if ((profile?.credits ?? 0) < 1) {
            setShowOutOfCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: messageText }]);

        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                         systemInstruction: "You are Mang AI, a friendly and expert branding assistant for Indonesian small businesses (UMKM). Your tone is encouraging, helpful, and uses some casual Indonesian slang like 'juragan', 'sokin', 'gacor', 'keren', 'mantap'. You answer questions about branding, social media, and how to use the 'logo.ku' application. Keep answers concise, actionable, and formatted with markdown (like **bold** or lists) for readability.",
                    },
                });
            }
            
            const response = await chatRef.current.sendMessage({ message: messageText });
            
            await deductCredits(1);
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
            
        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Waduh, Mang AI lagi pusing, nih. Coba tanya lagi nanti ya.";
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const promptStarters = [
        "Gimana cara bikin variasi logo?",
        "Kasih ide bio Instagram buat jualan kopi.",
        "Apa itu persona brand?",
        "Bedanya logo 'stacked' sama 'horizontal' apa?",
    ];

    return (
        <>
            <div id="ai-assistant-overlay" className={isOpen ? 'visible' : ''} onClick={togglePanel}></div>
            <button id="ai-assistant-fab" onClick={togglePanel} title="Tanya Mang AI">
                <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Panggil Mang AI" className="animate-breathing-ai" />
            </button>
            <div className={`ai-assistant-panel ${isOpen ? 'open' : ''}`}>
                <header className="ai-chat-header flex justify-between items-center">
                    <h3 className="text-xl font-bold text-indigo-400">Tanya Mang AI</h3>
                    <button onClick={togglePanel} title="Tutup" className="p-2 -mr-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="ai-chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-bubble ${msg.role}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                    ))}
                    {isLoading && (
                        <div className="chat-bubble model"><LoadingMessage /></div>
                    )}
                     {messages.length === 1 && !isLoading && (
                        <div className="flex flex-col gap-2 items-start">
                            <p className="text-sm text-gray-400 mb-2">Contoh pertanyaan:</p>
                            {promptStarters.map(prompt => (
                                <button key={prompt} onClick={() => handleSendMessage(undefined, prompt)} className="ai-prompt-starter">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form className="ai-chat-input-form" onSubmit={handleSendMessage}>
                    <div className="ai-chat-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ketik pertanyaan di sini..."
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading} title="Kirim (1 Token)">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

const App: React.FC = () => {
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
        session, user, profile, loading: authLoading, 
        showOutOfCreditsModal, setShowOutOfCreditsModal,
        showLogoutConfirm, setShowLogoutConfirm,
        handleLogout, executeLogout: authExecuteLogout,
        handleDeleteAccount, handleToggleMute, isMuted, 
        authError, refreshProfile, bgmSelection, handleBgmChange,
        deductCredits
    } = useAuth();
    
    const [appState, setAppState] = useState<AppState>(() => (sessionStorage.getItem('logoku_app_state') as AppState) || 'dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
        const id = sessionStorage.getItem('logoku_project_id');
        return id ? parseInt(id, 10) : null;
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [toast, setToast] = useState({ message: '', show: false });
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    
    // Modals visibility
    const [showContactModal, setShowContactModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showToSModal, setShowToSModal] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showProSyncModal, setShowProSyncModal] = useState(false); // NEW
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDashboardConfirm, setShowDashboardConfirm] = useState(false);
    
    // Dropdowns visibility
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isTokenInfoOpen, setIsTokenInfoOpen] = useState(false);

    // Refs
    const userMenuRef = useRef<HTMLDivElement>(null);
    const tokenInfoRef = useRef<HTMLDivElement>(null);
    const previousAppState = useRef<AppState>(appState);
    const previousSession = useRef<typeof session>(session);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'content_calendar', 'social_kit', 'profiles', 'social_ads', 'packaging', 'print_media'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;
    
    const showToast = useCallback((message: string) => {
        setToast({ message, show: true });
    }, []);

    // --- Effects for State Persistence & Initial Load ---
    useEffect(() => {
        if (session) {
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
            if (!previousSession.current && session) setShowWelcomeBanner(true);
            fetchProjects();
        }
        previousSession.current = session;
    }, [session, authLoading]);
    
    useEffect(() => {
        if (!session && !authLoading) setShowCaptcha(true);
    }, [session, authLoading]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (tokenInfoRef.current && !tokenInfoRef.current.contains(event.target as Node)) setIsTokenInfoOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProjects = async () => {
        if (!session?.user) return;
        const { data, error } = await supabase.from('projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (error) {
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

    const navigateTo = (state: AppState) => setAppState(state);

    // --- Core Navigation & Project Management ---
    const handleNewProject = useCallback(async () => {
        if (!session?.user) return;
        const { data, error } = await supabase.from('projects').insert({ user_id: session.user.id, project_data: {}, status: 'in-progress' as ProjectStatus }).select().single();
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
        saveWorkflowState(project.project_data);
        
        // Go to Brand Hub only for fully synced, completed projects.
        if (project.status === 'completed') {
            navigateTo('summary');
        } else {
            // Determine where to resume the wizard for in-progress projects
            let nextState: AppState = 'persona';
            const data = project.project_data;
            if (data.printMediaAssets) nextState = 'print_media';
            else if (data.selectedPackagingUrl) nextState = 'packaging';
            else if (data.socialAds) nextState = 'social_ads';
            else if (data.socialProfiles) nextState = 'profiles';
            else if (data.socialMediaKit) nextState = 'social_kit';
            else if (data.contentCalendar) nextState = 'content_calendar';
            else if (data.logoVariations) nextState = 'logo_detail';
            else if (data.selectedPersona) nextState = 'logo';
            navigateTo(nextState);
        }
    }, [projects]);

    const handleGoToCaptionGenerator = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            saveWorkflowState(project.project_data);
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
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
        setIsDeleting(false);
        if (error) {
            setGeneralError(`Gagal menghapus project: ${error.message}`);
        } else {
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            if (selectedProjectId === projectToDelete.id) handleReturnToDashboard();
            playSound('success');
        }
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
    };
    
    // --- Centralized Local Checkpoint Saver ---
    const saveLocalCheckpoint = useCallback((updatedData: Partial<ProjectData>) => {
        const currentState = loadWorkflowState() || {};
        const combinedData = { ...currentState, ...updatedData };
        saveWorkflowState(combinedData);
        showToast("Progres tersimpan sementara di browser!");
    }, [showToast]);

    // --- NEW A-Z WIZARD STEP HANDLERS (REWORKED) ---
    const handlePersonaComplete = useCallback((data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        const updatedData: Partial<ProjectData> = { brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan };
        saveLocalCheckpoint(updatedData);
        navigateTo('logo');
    }, [saveLocalCheckpoint]);
    
    const handleLogoComplete = useCallback((data: { logoBase64: string; prompt: string }) => {
        const updatedData = { selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt };
        saveLocalCheckpoint(updatedData);
        navigateTo('logo_detail');
    }, [saveLocalCheckpoint]);

    const handleLogoDetailComplete = useCallback((data: { finalLogoUrl: string; variations: LogoVariations }) => {
        const updatedData = { selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations };
        saveLocalCheckpoint(updatedData);
        navigateTo('content_calendar');
    }, [saveLocalCheckpoint]);

    const handleContentCalendarComplete = useCallback((data: { calendar: ContentCalendarEntry[], sources: any[] }) => {
        const updatedData = { contentCalendar: data.calendar, searchSources: data.sources };
        saveLocalCheckpoint(updatedData);
        navigateTo('social_kit');
    }, [saveLocalCheckpoint]);

    const handleSocialKitComplete = useCallback((data: { assets: SocialMediaKitAssets }) => {
        const updatedData = { socialMediaKit: data.assets };
        saveLocalCheckpoint(updatedData);
        navigateTo('profiles');
    }, [saveLocalCheckpoint]);

    const handleProfilesComplete = useCallback((data: { profiles: SocialProfileData }) => {
        const updatedData = { socialProfiles: data.profiles };
        saveLocalCheckpoint(updatedData);
        navigateTo('social_ads');
    }, [saveLocalCheckpoint]);

    const handleSocialAdsComplete = useCallback((data: { adsData: SocialAdsData }) => {
        const updatedData = { socialAds: data.adsData };
        saveLocalCheckpoint(updatedData);
        navigateTo('packaging');
    }, [saveLocalCheckpoint]);

    const handlePackagingComplete = useCallback((data: { packagingUrl: string }) => {
        const updatedData = { selectedPackagingUrl: data.packagingUrl };
        saveLocalCheckpoint(updatedData);
        navigateTo('print_media');
    }, [saveLocalCheckpoint]);

    const handlePrintMediaComplete = async (data: { assets: PrintMediaAssets }) => {
        if (!session?.user || !selectedProjectId) return;
        const currentState = loadWorkflowState() || {};
        const updatedData = { ...currentState, printMediaAssets: data.assets };
        
        const { data: dbData, error } = await supabase
            .from('projects')
            .update({ project_data: updatedData, status: 'local-complete' as ProjectStatus })
            .eq('id', selectedProjectId)
            .select()
            .single();
            
        if (error) {
            setGeneralError(`Gagal menyimpan finalisasi project: ${error.message}`);
            return;
        }
        
        const updatedProject: Project = dbData as any;
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        handleReturnToDashboard();
        showToast("Project disimpan lokal, siap disinkronkan!");
    };

    // --- Project Synchronization ---
    const handleRequestSyncProject = useCallback((projectId: number) => {
        // Instead of navigating, show the pro feature modal
        setShowProSyncModal(true);
        playSound('error');
    }, []);

    // --- [BRAND HUB] Centralized Asset Regeneration Logic ---
    const handleRegenerateTextAsset = async <T,>(
        projectId: number, assetKey: keyof ProjectData, cost: number, generationFunc: () => Promise<T>, successMessage: string
    ) => {
        setGeneralError(null);
        if ((profile?.credits ?? 0) < cost) { setShowOutOfCreditsModal(true); return; }
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            const result = await generationFunc();
            await deductCredits(cost);
            const updatedProjectData = { ...project.project_data, [assetKey]: result };
            const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single();
            if (error) throw error;
            
            setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p));
            showToast(successMessage);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Terjadi kesalahan regenerasi.';
            setGeneralError(msg);
        }
    };

    const handleRegenerateVisualAsset = async (
        projectId: number, assetKey: keyof ProjectData, cost: number, generationFunc: () => Promise<string | string[]>, successMessage: string, assetName: string
    ) => {
        setGeneralError(null);
        if (!user || (profile?.credits ?? 0) < cost) { setShowOutOfCreditsModal(true); return; }
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            const resultBase64 = await generationFunc();
            const publicUrl = await uploadImageFromBase64(Array.isArray(resultBase64) ? resultBase64[0] : resultBase64, user.id, projectId, `${assetName}-regen`);
            await deductCredits(cost);

            const updatedProjectData = { ...project.project_data, [assetKey]: publicUrl };
            const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single();
            if (error) throw error;

            setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p));
            showToast(successMessage);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Terjadi kesalahan regenerasi.';
            setGeneralError(msg);
        }
    };

    // --- REGENERATION HANDLER IMPLEMENTATIONS ---
    const handleRegenerateContentCalendar = async (projectId: number) => {
        const p = projects.find(p => p.id === projectId);
        if (!p?.project_data.brandInputs || !p.project_data.selectedPersona) return;
        handleRegenerateTextAsset(projectId, 'contentCalendar', 1, () => geminiService.generateContentCalendar(p.project_data.brandInputs.businessName, p.project_data.selectedPersona).then(res => res.calendar), "Kalender konten baru berhasil dibuat!");
    };
    const handleRegenerateProfiles = async (projectId: number) => {
        const p = projects.find(p => p.id === projectId);
        if (!p?.project_data.brandInputs || !p.project_data.selectedPersona) return;
        handleRegenerateTextAsset(projectId, 'socialProfiles', 1, () => geminiService.generateSocialProfiles(p.project_data.brandInputs, p.project_data.selectedPersona), "Profil sosmed baru berhasil dibuat!");
    };
    const handleRegenerateSocialAds = async (projectId: number) => {
        const p = projects.find(p => p.id === projectId);
        if (!p?.project_data.brandInputs || !p.project_data.selectedPersona || !p.project_data.selectedSlogan) return;
        handleRegenerateTextAsset(projectId, 'socialAds', 1, () => geminiService.generateSocialAds(p.project_data.brandInputs, p.project_data.selectedPersona, p.project_data.selectedSlogan), "Teks iklan baru berhasil dibuat!");
    };
    const handleRegenerateSocialKit = async (projectId: number) => {
        setGeneralError(null);
        if (!user || (profile?.credits ?? 0) < 2) { setShowOutOfCreditsModal(true); return; }
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.project_data.selectedLogoUrl) return;

        try {
            const assets = await geminiService.generateSocialMediaKitAssets(project.project_data as any);
            const [profilePicUrl, bannerUrl] = await Promise.all([
                uploadImageFromBase64(assets.profilePictureUrl, user.id, projectId, 'social-kit-pfp-regen'),
                uploadImageFromBase64(assets.bannerUrl, user.id, projectId, 'social-kit-banner-regen')
            ]);
            await deductCredits(2);

            const updatedProjectData = { ...project.project_data, socialMediaKit: { profilePictureUrl: profilePicUrl, bannerUrl: bannerUrl } };
            const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single();
            if (error) throw error;

            setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p));
            showToast("Social media kit baru berhasil dibuat!");
        } catch (err) {
            setGeneralError(err instanceof Error ? err.message : 'Gagal membuat social media kit.');
        }
    };
    const handleRegeneratePackaging = async (projectId: number) => {
        const p = projects.find(p => p.id === projectId);
        if (!p || !p.project_data.brandInputs || !p.project_data.selectedPersona || !p.project_data.selectedLogoUrl) return;
        const { brandInputs, selectedPersona, selectedLogoUrl } = p.project_data;
        const prompt = `Take the provided logo image. Create a realistic, high-quality product mockup of a generic product box for "${brandInputs.businessDetail}". Place the logo prominently. The brand is "${brandInputs.businessName}". The style is ${selectedPersona.kata_kunci.join(', ')}, modern, and clean. This is a commercial product photo.`;
        handleRegenerateVisualAsset(projectId, 'selectedPackagingUrl', 1, async () => {
            const logoBase64 = await fetchImageAsBase64(selectedLogoUrl);
            const result = await geminiService.generatePackagingDesign(prompt, logoBase64);
            return result[0];
        }, "Desain kemasan baru berhasil dibuat!", 'packaging');
    };
    const handleRegeneratePrintMedia = async (projectId: number, mediaType: 'banner' | 'roll_banner') => {
        const p = projects.find(p => p.id === projectId);
        if (!p || !p.project_data.selectedPersona || !p.project_data.selectedLogoUrl) return;
        const { selectedPersona, selectedLogoUrl } = p.project_data;
        let prompt = '';
        const colors = selectedPersona.palet_warna_hex.join(', ');
        const style = selectedPersona.kata_kunci.join(', ');

        if (mediaType === 'banner') {
            prompt = `Take the provided logo image. Create a clean, flat graphic design TEMPLATE for a wide horizontal outdoor banner (spanduk, 3:1 aspect ratio). Do NOT create a realistic 3D mockup. Use the brand's color palette: ${colors}. The design should be bold, incorporating the style: ${style}. Place the logo prominently. CRITICAL: DO NOT generate any text.`;
        } else {
            prompt = `Take the provided logo image. Create a clean, flat graphic design TEMPLATE for a vertical roll-up banner (9:16 aspect ratio). Do NOT create a realistic 3D mockup. Use the brand's color palette: ${colors}. The design should be stylish, modern, incorporating the style: ${style}. Place the logo prominently. CRITICAL: DO NOT generate any text.`;
        }
        
        handleRegenerateVisualAsset(projectId, 'printMediaAssets', 1, async () => {
             const logoBase64 = await fetchImageAsBase64(selectedLogoUrl);
             const resultBase64 = await geminiService.generatePrintMedia(prompt, logoBase64);
             const publicUrl = await uploadImageFromBase64(resultBase64[0], p.user_id, p.id, `print-${mediaType}-regen`);
             
             const currentAssets = p.project_data.printMediaAssets || {};
             const updatedAssets = mediaType === 'banner' ? { ...currentAssets, bannerUrl: publicUrl } : { ...currentAssets, rollBannerUrl: publicUrl };
             const updatedProjectData = { ...p.project_data, printMediaAssets: updatedAssets };
             
             const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single();
             if (error) throw error;
             
             setProjects(prev => prev.map(proj => proj.id === projectId ? (data as Project) : proj));
             showToast(`Template ${mediaType === 'banner' ? 'spanduk' : 'roll banner'} baru berhasil dibuat!`);
             return []; // Return empty as we handled the update manually
        }, '', ''); // Messages and asset name are handled manually inside
    };

    // --- Other Handlers ---
    const executeLogout = async () => {
        clearWorkflowState();
        sessionStorage.removeItem('logoku_app_state');
        sessionStorage.removeItem('logoku_project_id');
        await authExecuteLogout();
        setAppState('dashboard');
        setSelectedProjectId(null);
    };

    // --- Content Rendering ---
    const renderContent = () => {
        const workflowData = loadWorkflowState();
        const commonErrorProps = { onGoToDashboard: handleReturnToDashboard };

        switch (appState) {
            case 'persona': return <BrandPersonaGenerator onComplete={handlePersonaComplete} onGoToDashboard={handleReturnToDashboard} />;
            case 'logo':
                if (workflowData?.selectedPersona && workflowData.brandInputs) {
                    return <LogoGenerator persona={workflowData.selectedPersona} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoComplete} {...commonErrorProps} />;
                } break;
            case 'logo_detail':
                if (workflowData?.selectedLogoUrl && workflowData.logoPrompt && workflowData.brandInputs) {
                    return <LogoDetailGenerator baseLogoUrl={workflowData.selectedLogoUrl} basePrompt={workflowData.logoPrompt} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoDetailComplete} {...commonErrorProps} />;
                } break;
            case 'content_calendar': return <ContentCalendarGenerator projectData={workflowData || {}} onComplete={handleContentCalendarComplete} {...commonErrorProps} />;
            case 'social_kit': return <SocialMediaKitGenerator projectData={workflowData || {}} onComplete={handleSocialKitComplete} {...commonErrorProps} />;
            case 'profiles': return <ProfileOptimizer projectData={workflowData || {}} onComplete={handleProfilesComplete} {...commonErrorProps} />;
            case 'social_ads': return <SocialAdsGenerator projectData={workflowData || {}} onComplete={handleSocialAdsComplete} {...commonErrorProps} />;
            case 'packaging': return <PackagingGenerator projectData={workflowData || {}} onComplete={handlePackagingComplete} {...commonErrorProps} />;
            case 'print_media': return <PrintMediaGenerator projectData={workflowData || {}} onComplete={handlePrintMediaComplete} {...commonErrorProps} />;
            
            case 'sync_progress':
                const projectToSync = projects.find(p => p.id === selectedProjectId);
                if (projectToSync) {
                    return <SyncProgressScreen 
                        project={projectToSync}
                        onSyncComplete={async () => {
                            await fetchProjects();
                            handleReturnToDashboard();
                            showToast("Project berhasil disinkronkan!");
                        }}
                        onSyncError={async (error) => {
                            setGeneralError(`Gagal sinkronisasi: ${error.message}`);
                            await fetchProjects();
                            handleReturnToDashboard();
                        }}
                    />;
                } break;

            case 'summary':
                const projectToShow = projects.find(p => p.id === selectedProjectId);
                if (projectToShow) {
                    return <ProjectSummary 
                        project={projectToShow} 
                        onStartNew={handleReturnToDashboard} 
                        onGoToCaptionGenerator={handleGoToCaptionGenerator}
                        onGoToInstantContent={handleGoToInstantContent}
                        onDeleteProject={handleRequestDeleteProject}
                        onRegenerateContentCalendar={() => handleRegenerateContentCalendar(projectToShow.id)}
                        onRegenerateSocialKit={() => handleRegenerateSocialKit(projectToShow.id)}
                        onRegenerateProfiles={() => handleRegenerateProfiles(projectToShow.id)}
                        onRegenerateSocialAds={() => handleRegenerateSocialAds(projectToShow.id)}
                        onRegeneratePackaging={() => handleRegeneratePackaging(projectToShow.id)}
                        onRegeneratePrintMedia={(type) => handleRegeneratePrintMedia(projectToShow.id, type)}
                    />;
                } break;
            case 'caption':
                if (workflowData && selectedProjectId) { return <CaptionGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonErrorProps} />; } break;
            case 'instant_content':
                if (workflowData && selectedProjectId) { return <InstantContentGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonErrorProps} />; } break;
            case 'dashboard': default:
                return <ProjectDashboard 
                    projects={projects} 
                    onNewProject={handleNewProject} 
                    onSelectProject={handleSelectProject} 
                    showWelcomeBanner={showWelcomeBanner} 
                    onWelcomeBannerClose={() => setShowWelcomeBanner(false)} 
                    onDeleteProject={handleRequestDeleteProject} 
                    onSyncProject={handleRequestSyncProject}
                />;
        }
        handleReturnToDashboard();
        return <AuthLoadingScreen />;
    };
    
    // --- Main Component Return ---
    if (authLoading) return <AuthLoadingScreen />;
    
    if (!session) {
        return (
            <>
                <LoginScreen onGoogleLogin={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }})} isCaptchaSolved={!showCaptcha} onShowToS={() => setShowToSModal(true)} />
                <Suspense fallback={null}>
                    <PuzzleCaptchaModal show={showCaptcha} onSuccess={() => setShowCaptcha(false)} />
                    <TermsOfServiceModal show={showToSModal} onClose={() => setShowToSModal(false)} />
                </Suspense>
            </>
        );
    }
    
    return (
        <div className="text-white min-h-screen font-sans">
            <header className="py-3 px-4 md:py-4 md:px-8 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center relative">
                    {/* Header Left */}
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-indigo-400 cursor-pointer" onClick={handleReturnToDashboard}>
                            <span>logo<span className="text-white">.ku</span></span>
                        </h1>
                        <div className="font-handwritten text-lg md:text-2xl text-indigo-300 cursor-pointer hover:text-white transition-colors" onClick={() => setShowContactModal(true)}>
                            by @rangga.p.h
                        </div>
                    </div>
                    {/* Header Right */}
                    <div className="flex items-center gap-4 relative">
                        <img src={`${GITHUB_ASSETS_URL}Mang_AI.png`} alt="Mang AI peeking" className="animate-header-ai-peek w-12 h-12" />
                        {/* Token Info */}
                        <div className="relative" ref={tokenInfoRef}>
                            <div onClick={() => setIsTokenInfoOpen(p => !p)} className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full text-yellow-400 cursor-pointer hover:bg-gray-700/70 transition-colors" title="Info token">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                <span className="font-bold text-sm text-white">Sisa Token: {profile?.credits ?? 0}</span>
                            </div>
                             {isTokenInfoOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-3 z-20 text-xs animate-content-fade-in">
                                    <p className="font-bold text-white mb-1">Info Token Harian</p>
                                    <p className="text-gray-300">
                                        <span className="text-yellow-300">Bonus 20 token</span> di hari pertama, lalu dapatkan <span className="text-yellow-300">5 token gratis</span> setiap hari untuk terus berkarya!
                                    </p>
                                </div>
                            )}
                        </div>
                         {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setIsUserMenuOpen(p => !p)} title="User Menu" className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 rounded-full">
                                <img src={session.user.user_metadata.avatar_url} alt={session.user.user_metadata.full_name} className="w-9 h-9 rounded-full" />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20 animate-content-fade-in">
                                    {/* Menu Items */}
                                    <button onClick={handleRequestReturnToDashboard} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">Dashboard</button>
                                    <button onClick={() => { playSound('click'); setIsUserMenuOpen(false); setShowAboutModal(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">Tentang Aplikasi</button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={() => { playSound('click'); setIsUserMenuOpen(false); setShowProfileModal(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">Pengaturan Akun</button>
                                    <a href="https://saweria.co/logoku" target="_blank" rel="noopener noreferrer" onClick={() => setIsUserMenuOpen(false)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">Traktir Kopi</a>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <div className="px-4 pt-1 pb-1 text-xs text-gray-400">Pilih Musik</div>
                                    <div className="px-2 pb-2">
                                        <select aria-label="Pilih musik latar" value={bgmSelection} onChange={(e) => handleBgmChange(e.target.value as BgmSelection)} className="w-full text-left px-2 py-1.5 text-sm text-gray-200 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                            <option value="Mute">Bisukan BGM</option><option value="Random">Acak</option><option value="Jingle">Jingle</option><option value="Acoustic">Akustik</option><option value="Uplifting">Semangat</option><option value="LoFi">Lo-Fi</option><option value="Bamboo">Bambu</option><option value="Ethnic">Etnik</option><option value="Cozy">Santai</option>
                                        </select>
                                    </div>
                                    <button onClick={() => { handleToggleMute(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">{isMuted ? 'Suara Aktif' : 'Bisukan'}</button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 transition-colors">Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main id="main-content" className="py-6 md:py-10 px-4 md:px-8">
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
             <footer className="text-center py-6 px-4 text-sm text-gray-400 border-t border-gray-800">Powered by Atharrazka Core. Built for UMKM Indonesia.</footer>
            <AdBanner />
            <AiAssistant />
            <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
            {/* Modals */}
            <Suspense fallback={null}>
                <ContactModal show={showContactModal} onClose={() => setShowContactModal(false)} />
                <AboutModal show={showAboutModal} onClose={() => setShowAboutModal(false)} />
                <TermsOfServiceModal show={showToSModal} onClose={() => setShowToSModal(false)} />
                <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
                <ProFeatureModal show={showProSyncModal} onClose={() => setShowProSyncModal(false)} />
                <ProfileSettingsModal show={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} profile={profile} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onShowToS={() => setShowToSModal(true)} onShowContact={() => setShowContactModal(true)} />
                <ConfirmationModal show={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={executeLogout} title="Yakin Mau Logout?" confirmText="Ya, Logout Saja" cancelText="Nggak Jadi">Progres yang belum final bakal ilang lho. Tetep mau lanjut?</ConfirmationModal>
                <ConfirmationModal show={showDashboardConfirm} onClose={() => setShowDashboardConfirm(false)} onConfirm={confirmAndReturnToDashboard} title="Kembali ke Dashboard?" confirmText="Ya, Kembali" cancelText="Batal">Progres di tahap ini bakal hilang. Yakin mau kembali?</ConfirmationModal>
                <DeleteProjectSliderModal show={showDeleteConfirm} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} isConfirmLoading={isDeleting} projectNameToDelete={projectToDelete?.project_data?.brandInputs?.businessName || 'Project Ini'} />
            </Suspense>
        </div>
    );
};

export default App;
