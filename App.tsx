// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { supabase, supabaseError } from './services/supabaseClient';
import { playSound } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus, Profile, AIPetState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AIPetProvider, useAIPet } from './contexts/AIPetContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { UserActionsProvider, useUserActions } from './contexts/UserActionsContext';

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
import CalloutPopup from './components/common/CalloutPopup';
import VoiceBrandingWizard from './components/VoiceBrandingWizard';
import Tooltip from './components/common/Tooltip';

// --- Lazily Loaded Components ---
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const BrandPersonaGenerator = React.lazy(() => import('./components/BrandPersonaGenerator'));
const LogoGenerator = React.lazy(() => import('./components/LogoGenerator'));
const LogoDetailGenerator = React.lazy(() => import('./components/LogoDetailGenerator'));
const ProjectSummary = React.lazy(() => import('./components/ProjectSummary'));
const CaptionGenerator = React.lazy(() => import('./components/CaptionGenerator'));
const InstantContentGenerator = React.lazy(() => import('./components/InstantContentGenerator'));
const ContactModal = React.lazy(() => import('./components/common/ContactModal'));
const AboutModal = React.lazy(() => import('./components/common/AboutModal'));
const TermsOfServiceModal = React.lazy(() => import('./components/common/TermsOfServiceModal'));
const PrivacyPolicyModal = React.lazy(() => import('./components/common/PrivacyPolicyModal'));
const OutOfCreditsModal = React.lazy(() => import('./components/common/OutOfCreditsModal'));
const ProfileSettingsModal = React.lazy(() => import('./components/common/ProfileSettingsModal'));
const ConfirmationModal = React.lazy(() => import('./components/common/ConfirmationModal'));
const DeleteProjectSliderModal = React.lazy(() => import('./components/common/DeleteProjectSliderModal'));
const PuzzleCaptchaModal = React.lazy(() => import('./components/common/PuzzleCaptchaModal'));
const ContentCalendarGenerator = React.lazy(() => import('./components/ContentCalendarGenerator'));
const SocialMediaKitGenerator = React.lazy(() => import('./components/SocialMediaKitGenerator'));
const ProfileOptimizer = React.lazy(() => import('./components/ProfileOptimizer'));
const SocialAdsGenerator = React.lazy(() => import('./components/SocialAdsGenerator'));
const PackagingGenerator = React.lazy(() => import('./components/PackagingGenerator'));
const PrintMediaGenerator = React.lazy(() => import('./components/PrintMediaGenerator'));
const MerchandiseGenerator = React.lazy(() => import('./components/MerchandiseGenerator'));
const HeaderStats = React.lazy(() => import('./components/gamification/HeaderStats'));
const LevelUpModal = React.lazy(() => import('./components/gamification/LevelUpModal'));
const AchievementToast = React.lazy(() => import('./components/gamification/AchievementToast'));
const BrandGalleryModal = React.lazy(() => import('./components/BrandGalleryModal'));
const Sotoshop = React.lazy(() => import('./components/Sotoshop'));
const AIPetVisual = React.lazy(() => import('./components/AIPetVisual'));
const AIPetLabModal = React.lazy(() => import('./components/AIPetLabModal'));
const AIPetContextualBubble = React.lazy(() => import('./components/AIPetContextualBubble'));
const AIPetInteractionBubble = React.lazy(() => import('./components/AIPetInteractionBubble'));


type AppState = 'dashboard' | 'persona' | 'logo' | 'logo_detail' | 'social_kit' | 'profiles' | 'packaging' | 'print_media' | 'content_calendar' | 'social_ads' | 'merchandise' | 'summary' | 'caption' | 'instant_content';
type PetBehavior = 'idle' | 'walking' | 'running' | 'jumping' | 'interacting' | 'turning' | 'somersault';

const FloatingAIPet: React.FC<{ petState: AIPetState, isVisible: boolean }> = ({ 
    petState, 
    isVisible, 
}) => {
    const { contextualMessage, showContextualMessage } = useAIPet();
    const { toggleAssistant, toggleAIPetLab } = useUI();
    const [position, setPosition] = useState({ x: 50, direction: 1 });
    const [behavior, setBehavior] = useState<PetBehavior>('idle');
    const [isInteracting, setIsInteracting] = useState(false);
    
    const animationFrameRef = useRef<number | null>(null);
    const behaviorTimeoutRef = useRef<number | null>(null);
    const interactionTimeoutRef = useRef<number | null>(null);

    const [isBubbleOpen, setBubbleOpen] = useState(false);

    // Main animation loop for movement
    useEffect(() => {
        const move = () => {
            if (behavior === 'walking' || behavior === 'running') {
                const speed = behavior === 'running' ? 0.25 : 0.08;
                setPosition(prev => {
                    let newX = prev.x + speed * prev.direction;
                    let newDirection = prev.direction;
                    if (newX > 98 || newX < 2) { 
                        newDirection = newX > 98 ? -1 : 1;
                        setBehavior('turning'); 
                    }
                    return { x: newX, direction: newDirection };
                });
            }
            animationFrameRef.current = requestAnimationFrame(move);
        };
        animationFrameRef.current = requestAnimationFrame(move);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [behavior]);

    useEffect(() => {
        if (behaviorTimeoutRef.current) clearTimeout(behaviorTimeoutRef.current);

        if (isInteracting) {
            return;
        }

        const randomDelay = () => 2000 + Math.random() * 2000;

        switch (behavior) {
            case 'idle':
                behaviorTimeoutRef.current = window.setTimeout(() => {
                    const nextAction = Math.random();
                    if (nextAction < 0.05) {
                        setBehavior('somersault');
                    } else {
                        setBehavior('walking');
                    }
                }, randomDelay());
                break;
            case 'walking':
                behaviorTimeoutRef.current = window.setTimeout(() => {
                    const nextAction = Math.random();
                    if (nextAction < 0.15) setBehavior('running');
                    else if (nextAction < 0.25) setBehavior('jumping');
                    else setBehavior('idle');
                }, randomDelay());
                break;
            case 'running':
                behaviorTimeoutRef.current = window.setTimeout(() => {
                    setBehavior('walking');
                }, randomDelay());
                break;
            case 'turning':
                behaviorTimeoutRef.current = window.setTimeout(() => setBehavior('idle'), 1000);
                break;
            case 'jumping':
                behaviorTimeoutRef.current = window.setTimeout(() => setBehavior('idle'), 800);
                break;
            case 'somersault':
                behaviorTimeoutRef.current = window.setTimeout(() => setBehavior('idle'), 1500);
                break;
            default:
                break;
        }
        
        return () => {
            if (behaviorTimeoutRef.current) {
                clearTimeout(behaviorTimeoutRef.current);
            }
        };
    }, [behavior, isInteracting]);
    
    const handlePetClick = () => {
        if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
        setBubbleOpen(p => !p);
        setIsInteracting(true);
        interactionTimeoutRef.current = window.setTimeout(() => setIsInteracting(false), 1200);
    };

    const animationClass = isVisible ? 'animate-aipet-appear' : 'animate-aipet-disappear';
    const petContainerClass = 'w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40';

    return (
        <div 
            className={`fixed bottom-0 z-40 transition-transform duration-300 ${!isVisible ? 'pointer-events-none' : ''}`}
            style={{ left: `${position.x}vw`, transform: `translateX(-50%)`, transition: 'left 0.1s linear' }}
        >
             <Suspense fallback={null}>
                <AIPetContextualBubble
                    message={contextualMessage}
                    onClose={() => showContextualMessage(null)}
                />
            </Suspense>
            
            <div 
                onClick={handlePetClick}
                className={`cursor-pointer group relative ${animationClass} ${petContainerClass}`}
            >
                <Suspense fallback={null}>
                    <AIPetVisual 
                        petState={petState} 
                        behavior={isInteracting ? 'interacting' : behavior}
                        direction={position.direction}
                    />
                </Suspense>
            </div>
            
            {petState.stage === 'active' && (
              <Suspense fallback={null}>
                  <AIPetInteractionBubble
                      isOpen={isBubbleOpen}
                      onClose={() => setBubbleOpen(false)}
                      onAsk={() => toggleAssistant(true)}
                      onShowLab={() => toggleAIPetLab(true)}
                      petName={petState.name}
                  />
              </Suspense>
            )}
        </div>
    );
};


const AiAssistant: React.FC<{ petName: string }> = ({ petName }) => {
    const { profile } = useAuth();
    const { isAssistantOpen, toggleAssistant } = useUI();
    const { deductCredits, setShowOutOfCreditsModal } = useUserActions();
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const defaultPromptStarters = [ "Berapa token gratis yang saya dapat?", "Project pertama bayar gak?", "Gimana cara nyimpen logo saya?", "Apa itu persona brand?", ];

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages, isLoading]);
    
    useEffect(() => {
        if(isAssistantOpen && messages.length === 0) setMessages([{ role: 'model', text: `Halo Juragan! Aku ${petName}, siap bantu. Ada yang bisa dibantuin soal branding atau fitur di aplikasi ini?` }]);
    }, [isAssistantOpen, messages.length, petName]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; }
    }, [input]);
    
    const handleSendMessage = async (e?: React.FormEvent, prompt?: string) => {
        e?.preventDefault();
        const messageText = (prompt || input).trim();
        if (!messageText || isLoading) return;
        if ((profile?.credits ?? 0) < 1) { setShowOutOfCreditsModal(true); return; }
        setIsLoading(true); setInput(''); setMessages(prev => [...prev, { role: 'user', text: messageText }]);
        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
                chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: `You are an AI Pet assistant named ${petName}. You are a friendly and expert branding assistant for Indonesian small businesses (UMKM). Your tone is encouraging, helpful, and uses some casual Indonesian slang like 'juragan', 'sokin', 'gacor', 'keren', 'mantap'. You answer questions about branding, social media, and how to use the 'desain.fun' application. Your goal is to make branding feel fun and easy. Keep answers concise, actionable, and formatted with markdown (like **bold** or lists) for readability.`, }, });
            }
            const response = await chatRef.current.sendMessage({ message: messageText });
            await deductCredits(1);
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage = error instanceof Error ? error.message : `Waduh, aku lagi pusing, nih. Coba tanya lagi nanti ya.`;
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
        } finally { setIsLoading(false); }
    };

    return (
        <>
            <div id="ai-assistant-overlay" className={isAssistantOpen ? 'visible' : ''} onClick={() => toggleAssistant(false)}></div>
            <div className={`ai-assistant-panel ${isAssistantOpen ? 'open' : ''}`}>
                <header className="p-4 border-b border-border-main flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-bold text-primary">Tanya {petName}</h3>
                    <button onClick={() => toggleAssistant(false)} title="Tutup" className="p-2 text-primary rounded-full hover:bg-background hover:text-primary-hover close-button-glow">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-bubble max-w-[85%] py-2 px-4 rounded-2xl ${msg.role === 'user' ? 'user self-end rounded-br-lg' : 'model self-start rounded-bl-lg'}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                    ))}
                    {isLoading && <div className="chat-bubble model self-start rounded-bl-lg"><LoadingMessage /></div>}
                     {messages.length === 1 && !isLoading && (
                        <div className="flex flex-col gap-2 items-start animate-content-fade-in">
                            <p className="text-sm text-text-muted mb-1">Contoh pertanyaan:</p>
                            {defaultPromptStarters.map(prompt => (
                                <button key={prompt} onClick={() => handleSendMessage(undefined, prompt)} className="bg-background border border-border-main text-text-body px-3 py-1.5 rounded-lg text-sm text-left hover:bg-border-light transition-colors">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form className="p-4 border-t border-border-main flex-shrink-0" onSubmit={handleSendMessage}>
                    <div className="relative">
                        <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pertanyaan di sini..." rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} className="w-full resize-none rounded-xl border border-border-main bg-background p-3 pr-12 text-text-body focus:outline-none focus:ring-2 focus:ring-primary" />
                        <button type="submit" disabled={!input.trim() || isLoading} title="Kirim (1 Token)" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; onToggle: () => void }> = ({ theme, onToggle }) => (
    <button onClick={onToggle} title="Ganti Tema" className="p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors">
        <div className="w-6 h-6 relative">
            {/* Sun */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`absolute inset-0 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
            {/* Moon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`absolute inset-0 transition-all duration-300 ${theme === 'light' ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
        </div>
    </button>
);


const App: React.FC = () => {
    if (supabaseError) return <SupabaseKeyErrorScreen error={supabaseError} />;
    if (!import.meta.env?.VITE_API_KEY) return <ApiKeyErrorScreen />;
    return (
      <AuthProvider>
        <UserActionsProvider>
          <UIProvider>
            <AIPetProvider>
              <MainApp />
            </AIPetProvider>
          </UIProvider>
        </UserActionsProvider>
      </AuthProvider>
    );
};

const MainApp: React.FC = () => {
    const { session, user, profile, projects, setProjects, loading: authLoading, showLogoutConfirm, setShowLogoutConfirm, handleLogout, executeLogout: authExecuteLogout, handleDeleteAccount, authError } = useAuth();
    const { showOutOfCreditsModal, setShowOutOfCreditsModal, showLevelUpModal, levelUpInfo, setShowLevelUpModal, unlockedAchievement, setUnlockedAchievement, deductCredits, grantFirstTimeCompletionBonus, addXp, grantAchievement } = useUserActions();
    const { toast, showToast, closeToast, ...uiToggles } = useUI();
    const aipetContext = useAIPet();
    const { petState, isPetOnScreen } = aipetContext;
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('desainfun_theme') as 'light' | 'dark') || 'dark');
    const [appState, setAppState] = useState<AppState>(() => (sessionStorage.getItem('desainfun_app_state') as AppState) || 'dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
        const id = sessionStorage.getItem('desainfun_project_id');
        return id ? parseInt(id, 10) : null;
    });
    
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDashboardConfirm, setShowDashboardConfirm] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(true);
    
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const previousAppState = useRef<AppState>(appState);

    const [showXpGain, setShowXpGain] = useState(false);
    const prevXp = useRef(profile?.xp ?? 0);

    const workflowSteps: AppState[] = ['persona', 'logo', 'logo_detail', 'social_kit', 'profiles', 'packaging', 'print_media', 'content_calendar', 'social_ads', 'merchandise'];
    const currentStepIndex = workflowSteps.indexOf(appState);
    const showStepper = currentStepIndex !== -1;
    
    const preloadBrandPersona = () => import('./components/BrandPersonaGenerator');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('desainfun_theme', theme);
    }, [theme]);
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    useEffect(() => {
        if (session) {
            if (appState === 'dashboard') { sessionStorage.removeItem('desainfun_app_state'); sessionStorage.removeItem('desainfun_project_id'); }
            else { sessionStorage.setItem('desainfun_app_state', appState); if (selectedProjectId !== null) sessionStorage.setItem('desainfun_project_id', selectedProjectId.toString()); else sessionStorage.removeItem('desainfun_project_id'); }
        }
    }, [appState, selectedProjectId, session]);
    
    useEffect(() => { if (!session && !authLoading) setShowCaptcha(true); else setShowCaptcha(false); }, [session, authLoading]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (previousAppState.current !== appState) { playSound('transition'); window.scrollTo(0, 0); }
        previousAppState.current = appState;
    }, [appState]);

    useEffect(() => {
        let idleTimeout: number;
        const resetTimer = () => { clearTimeout(idleTimeout); idleTimeout = window.setTimeout(() => aipetContext.notifyPetOfActivity('user_idle'), 120000); };
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();
        return () => { clearTimeout(idleTimeout); events.forEach(event => window.removeEventListener(event, resetTimer)); };
    }, [aipetContext.notifyPetOfActivity]);

    useEffect(() => {
        if (profile && profile.xp > prevXp.current) { setShowXpGain(true); setTimeout(() => setShowXpGain(false), 1500); }
        prevXp.current = profile?.xp ?? 0;
    }, [profile?.xp]);

    const navigateTo = (state: AppState) => setAppState(state);

    const handleStartManualProject = useCallback(async (templateData?: Partial<BrandInputs>) => {
        if (!session?.user || !profile) return;
        if (profile.total_projects_completed === 0 && projects.length === 0) sessionStorage.setItem('onboardingStep2', 'true');
        const initialData = templateData ? { brandInputs: templateData } : {};
        const { data, error } = await supabase.from('projects').insert({ user_id: session.user.id, project_data: initialData, status: 'in-progress' as ProjectStatus }).select().single();
        if (error) { setGeneralError(`Gagal memulai project baru: ${error.message}`); return; }
        const newProject: Project = data as any;
        setProjects(prev => [newProject, ...prev]); setSelectedProjectId(newProject.id);
        if (templateData) saveWorkflowState({ brandInputs: templateData as BrandInputs }); else clearWorkflowState();
        navigateTo('persona');
    }, [session, profile, projects, setProjects]);
    
    const handleWizardComplete = useCallback(async (projectData: Partial<ProjectData>) => {
        if (!session?.user) {
            setGeneralError("Sesi tidak ditemukan. Silakan login ulang.");
            return;
        }
        
        uiToggles.toggleVoiceWizard(false);
        showToast("Mantap! Konsultasi suara selesai, project sedang dibuat...");
    
        try {
            const { data, error } = await supabase.from('projects').insert({
                user_id: session.user.id,
                project_data: projectData,
                status: 'in-progress' as ProjectStatus
            }).select().single();
    
            if (error) throw error;
    
            const newProject: Project = data as any;
            setProjects(prev => [newProject, ...prev]);
            setSelectedProjectId(newProject.id);
            saveWorkflowState(projectData);

            if (projectData.selectedLogoUrl) {
                navigateTo('logo_detail');
                 showToast("Logo master berhasil dibuat! Lanjut finalisasi.");
            } else {
                navigateTo('logo');
                showToast("Fondasi brand berhasil dibuat! Lanjut bikin logo.");
            }
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal membuat project dari konsultasi suara.';
            setGeneralError(errorMessage);
        }
    
    }, [session, setProjects, showToast, uiToggles]);

    const handleReturnToDashboard = useCallback(() => { clearWorkflowState(); setSelectedProjectId(null); navigateTo('dashboard'); }, []);
    const handleRequestReturnToDashboard = useCallback(() => { if (appState === 'dashboard') { setIsUserMenuOpen(false); handleReturnToDashboard(); return; } setShowDashboardConfirm(true); setIsUserMenuOpen(false); }, [appState, handleReturnToDashboard]);
    const confirmAndReturnToDashboard = useCallback(() => { handleReturnToDashboard(); setShowDashboardConfirm(false); }, [handleReturnToDashboard]);

    const handleSelectProject = useCallback((projectId: number) => {
        const project = projects.find(p => p.id === projectId); if (!project) return;
        setSelectedProjectId(projectId); saveWorkflowState(project.project_data);
        if (project.status === 'completed') { navigateTo('summary'); }
        else {
            const data = project.project_data; let nextState: AppState = 'persona';
            if (data.selectedPersona) if (data.selectedLogoUrl) if (data.logoVariations) if (data.socialMediaKit) if (data.socialProfiles) if (data.selectedPackagingUrl) if (data.printMediaAssets) if (data.contentCalendar) if (data.socialAds) nextState = data.merchandiseUrl ? 'summary' : 'merchandise'; else nextState = 'social_ads'; else nextState = 'content_calendar'; else nextState = 'print_media'; else nextState = 'packaging'; else nextState = 'profiles'; else nextState = 'social_kit'; else nextState = 'logo_detail'; else nextState = 'logo';
            navigateTo(nextState);
        }
    }, [projects]);

    const handleGoToCaptionGenerator = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { saveWorkflowState(project.project_data); setSelectedProjectId(project.id); navigateTo('caption'); } }, [projects]);
    const handleGoToInstantContent = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { saveWorkflowState(project.project_data); setSelectedProjectId(project.id); navigateTo('instant_content'); } }, [projects]);

    const handleRequestDeleteProject = useCallback((projectId: number) => { const project = projects.find(p => p.id === projectId); if (project) { setProjectToDelete(project); setShowDeleteConfirm(true); } }, [projects]);
    const handleCancelDelete = useCallback(() => { setShowDeleteConfirm(false); setProjectToDelete(null); }, []);
    const handleConfirmDelete = useCallback(async () => {
        if (!projectToDelete || !user) return; setIsDeleting(true);
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
        setIsDeleting(false);
        if (error) { setGeneralError(`Gagal menghapus project: ${error.message}`); }
        else { setProjects(prev => prev.filter(p => p.id !== projectToDelete.id)); if (selectedProjectId === projectToDelete.id) handleReturnToDashboard(); playSound('success'); }
        setShowDeleteConfirm(false); setProjectToDelete(null);
    }, [projectToDelete, user, selectedProjectId, handleReturnToDashboard, setProjects]);

    const handleShareToForum = useCallback((project: Project) => {
        const { brandInputs } = project.project_data;
        const forumPreload = { title: `Minta masukan dong buat brand baruku: "${brandInputs.businessName}"`, content: `Halo Juragan semua!\n\nAku baru aja selesai ngeracik brand baru pakai Mang AI, namanya "${brandInputs.businessName}". Ini brand yang bergerak di bidang ${brandInputs.industry}.\n\nKira-kira ada masukan nggak soal logo, nama, atau apa aja biar makin gacor?\n\nMakasih sebelumnya!` };
        sessionStorage.setItem('forumPreload', JSON.stringify(forumPreload)); sessionStorage.setItem('openForumTab', 'true'); handleReturnToDashboard();
    }, [handleReturnToDashboard]);
    
    const saveLocalCheckpoint = useCallback((updatedData: Partial<ProjectData>) => { const currentState = loadWorkflowState() || {}; const combinedData = { ...currentState, ...updatedData }; saveWorkflowState(combinedData); showToast("Progres tersimpan sementara!"); }, [showToast]);

    const handlePersonaComplete = useCallback(async (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => {
        saveLocalCheckpoint({ brandInputs: data.inputs, selectedPersona: data.selectedPersona, selectedSlogan: data.selectedSlogan });
        if (session?.user && selectedProjectId) {
            const currentData = loadWorkflowState();
            const { data: updatedProject, error: updateError } = await supabase.from('projects').update({ project_data: currentData }).eq('id', selectedProjectId).select().single();
            if (updateError) { setGeneralError(`Gagal menyimpan progres awal: ${updateError.message}`); return; }
            setProjects(prev => prev.map(p => p.id === selectedProjectId ? (updatedProject as Project) : p));
        }
        await grantFirstTimeCompletionBonus('persona'); 
        navigateTo('logo');
    }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus, session, selectedProjectId, setProjects]);

    const handleLogoComplete = useCallback(async (data: { logoBase64: string; prompt: string }) => { saveLocalCheckpoint({ selectedLogoUrl: data.logoBase64, logoPrompt: data.prompt }); await grantFirstTimeCompletionBonus('logo'); navigateTo('logo_detail'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handleLogoDetailComplete = useCallback(async (data: { finalLogoUrl: string; variations: LogoVariations }) => { saveLocalCheckpoint({ selectedLogoUrl: data.finalLogoUrl, logoVariations: data.variations }); await grantFirstTimeCompletionBonus('logo_detail'); navigateTo('social_kit'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handleSocialKitComplete = useCallback(async (data: { assets: SocialMediaKitAssets }) => { saveLocalCheckpoint({ socialMediaKit: data.assets }); await grantFirstTimeCompletionBonus('social_kit'); navigateTo('profiles'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handleProfilesComplete = useCallback(async (data: { profiles: SocialProfileData }) => { saveLocalCheckpoint({ socialProfiles: data.profiles }); await grantFirstTimeCompletionBonus('profiles'); navigateTo('packaging'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handlePackagingComplete = useCallback(async (data: { packagingUrl: string }) => { saveLocalCheckpoint({ selectedPackagingUrl: data.packagingUrl }); await grantFirstTimeCompletionBonus('packaging'); navigateTo('print_media'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handlePrintMediaComplete = useCallback(async (data: { assets: PrintMediaAssets }) => { saveLocalCheckpoint({ printMediaAssets: data.assets }); await grantFirstTimeCompletionBonus('print_media'); navigateTo('content_calendar'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handleContentCalendarComplete = useCallback(async (data: { calendar: ContentCalendarEntry[], sources: any[] }) => { saveLocalCheckpoint({ contentCalendar: data.calendar, searchSources: data.sources }); await grantFirstTimeCompletionBonus('content_calendar'); navigateTo('social_ads'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    const handleSocialAdsComplete = useCallback(async (data: { adsData: SocialAdsData }) => { saveLocalCheckpoint({ socialAds: data.adsData }); await grantFirstTimeCompletionBonus('social_ads'); navigateTo('merchandise'); }, [saveLocalCheckpoint, grantFirstTimeCompletionBonus]);
    
    const handleMerchandiseComplete = useCallback(async (merchandiseUrl: string) => {
        if (!session?.user || !selectedProjectId || !profile) return;
        const currentState = loadWorkflowState() || {};
        const finalProjectData = { ...currentState, merchandiseUrl };

        const { data: updatedProject, error: projectError } = await supabase
            .from('projects')
            .update({ project_data: finalProjectData, status: 'completed' as ProjectStatus })
            .eq('id', selectedProjectId)
            .select()
            .single();

        if (projectError) {
            setGeneralError(`Gagal menyimpan finalisasi project: ${projectError.message}`);
            return;
        }

        setProjects(prev => prev.map(p => p.id === (updatedProject as Project).id ? (updatedProject as Project) : p));
        aipetContext.notifyPetOfActivity('project_completed');
        handleReturnToDashboard();
        showToast("Mantap! Project lo berhasil diselesaikan.");

        const runPostCompletionTasks = async () => {
            try {
                await grantFirstTimeCompletionBonus('merchandise');
                await addXp(500);
                const newTotalCompleted = (profile.total_projects_completed ?? 0) + 1;
                if (newTotalCompleted === 1) await grantAchievement('BRAND_PERTAMA_LAHIR');
                else if (newTotalCompleted === 5) await grantAchievement('SANG_KOLEKTOR');
                else if (newTotalCompleted === 10) await grantAchievement('SULTAN_KONTEN');
            } catch (e) {
                console.error("Error during post-completion tasks:", e);
            }
        };

        runPostCompletionTasks();

    }, [session, user, selectedProjectId, profile, setProjects, handleReturnToDashboard, showToast, aipetContext, grantFirstTimeCompletionBonus, addXp, grantAchievement]);

    const handleRegenerateTextAsset = useCallback(async <T,>(projectId: number, assetKey: keyof ProjectData, cost: number, generationFunc: () => Promise<T>, successMessage: string) => {
        if ((profile?.credits ?? 0) < cost) { setShowOutOfCreditsModal(true); return; } const project = projects.find(p => p.id === projectId); if (!project) return;
        try { const result = await generationFunc(); if (!(await deductCredits(cost))) return; const updatedProjectData = { ...project.project_data, [assetKey]: result }; const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single(); if (error) throw error; setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p)); showToast(successMessage); } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Terjadi kesalahan regenerasi.'); }
    }, [profile, projects, deductCredits, setShowOutOfCreditsModal, showToast, setProjects]);
    const handleRegenerateVisualAsset = useCallback(async (projectId: number, assetKey: keyof ProjectData, cost: number, generationFunc: () => Promise<string>, successMessage: string) => {
        if (!user || (profile?.credits ?? 0) < cost) { setShowOutOfCreditsModal(true); return; } const project = projects.find(p => p.id === projectId); if (!project) return;
        try { const resultBase64 = await generationFunc(); if (!(await deductCredits(cost))) return; const updatedProjectData = { ...project.project_data, [assetKey]: resultBase64 }; const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single(); if (error) throw error; setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p)); showToast(successMessage); } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Terjadi kesalahan regenerasi.'); }
    }, [user, profile, projects, deductCredits, setShowOutOfCreditsModal, showToast, setProjects]);
    const handleRegenerateContentCalendar = useCallback(async (projectId: number) => { const p = projects.find(p => p.id === projectId); if (!p?.project_data.brandInputs || !p.project_data.selectedPersona) return; handleRegenerateTextAsset(projectId, 'contentCalendar', 1, () => geminiService.generateContentCalendar(p.project_data.brandInputs.businessName, p.project_data.selectedPersona, petState).then(res => res.calendar), "Kalender konten baru berhasil dibuat!"); }, [projects, handleRegenerateTextAsset, petState]);
    const handleRegenerateProfiles = useCallback(async (projectId: number) => { const p = projects.find(p => p.id === projectId); if (!p?.project_data.brandInputs || !p.project_data.selectedPersona) return; handleRegenerateTextAsset(projectId, 'socialProfiles', 1, () => geminiService.generateSocialProfiles(p.project_data.brandInputs, p.project_data.selectedPersona, petState), "Profil sosmed baru berhasil dibuat!"); }, [projects, handleRegenerateTextAsset, petState]);
    const handleRegenerateSocialAds = useCallback(async (projectId: number) => { const p = projects.find(p => p.id === projectId); if (!p?.project_data.brandInputs || !p.project_data.selectedPersona || !p.project_data.selectedSlogan) return; handleRegenerateTextAsset(projectId, 'socialAds', 1, () => geminiService.generateSocialAds(p.project_data.brandInputs, p.project_data.selectedPersona, p.project_data.selectedSlogan, petState), "Teks iklan baru berhasil dibuat!"); }, [projects, handleRegenerateTextAsset, petState]);
    const handleRegenerateSocialKit = useCallback(async (projectId: number) => {
        const project = projects.find(p => p.id === projectId); if (!project || !project.project_data.selectedLogoUrl) return;
        try { if (!(await deductCredits(2))) return; const assets = await geminiService.generateSocialMediaKitAssets(project.project_data as any); const updatedProjectData = { ...project.project_data, socialMediaKit: assets }; const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single(); if (error) throw error; setProjects(prev => prev.map(p => p.id === projectId ? (data as Project) : p)); showToast("Social media kit baru berhasil dibuat!"); } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Gagal membuat social media kit.'); }
    }, [projects, deductCredits, showToast, setProjects]);
    const handleRegeneratePackaging = useCallback(async (projectId: number) => { const p = projects.find(p => p.id === projectId); if (!p || !p.project_data.brandInputs || !p.project_data.selectedPersona || !p.project_data.selectedLogoUrl) return; const { brandInputs, selectedPersona, selectedLogoUrl } = p.project_data; const prompt = `Take the provided logo image. Create a realistic, high-quality product mockup of a generic product box for "${brandInputs.businessDetail}". Place the logo prominently. The brand is "${brandInputs.businessName}". The style is ${selectedPersona.kata_kunci.join(', ')}, modern, and clean. This is a commercial product photo.`; handleRegenerateVisualAsset(projectId, 'selectedPackagingUrl', 1, async () => { const logoBase64 = await fetchImageAsBase64(selectedLogoUrl); return (await geminiService.generatePackagingDesign(prompt, logoBase64))[0]; }, "Desain kemasan baru berhasil dibuat!"); }, [projects, handleRegenerateVisualAsset]);
    const handleRegeneratePrintMedia = useCallback(async (projectId: number, mediaType: 'banner' | 'roll_banner') => {
        const p = projects.find(p => p.id === projectId); if (!p || !p.project_data.selectedPersona || !p.project_data.selectedLogoUrl) return; const { selectedPersona, selectedLogoUrl } = p.project_data; let prompt = ''; const colors = selectedPersona.palet_warna_hex.join(', '); const style = selectedPersona.kata_kunci.join(', ');
        if (mediaType === 'banner') prompt = `Take the provided logo image. Create a clean, flat graphic design TEMPLATE for a wide horizontal outdoor banner (spanduk, 3:1 aspect ratio). Do NOT create a realistic 3D mockup. Use the brand's color palette: ${colors}. The design should be bold, incorporating the style: ${style}. Place the logo prominently. CRITICAL: DO NOT generate any text.`;
        else prompt = `Take the provided logo image. Create a clean, flat graphic design TEMPLATE for a vertical roll-up banner (9:16 aspect ratio). Do NOT create a realistic 3D mockup. Use the brand's color palette: ${colors}. The design should be stylish, modern, incorporating the style: ${style}. Place the logo prominently. CRITICAL: DO NOT generate any text.`;
        try { if (!(await deductCredits(1))) return; const logoBase64 = await fetchImageAsBase64(selectedLogoUrl); const resultBase64 = (await geminiService.generatePrintMedia(prompt, logoBase64))[0]; const currentAssets = p.project_data.printMediaAssets || {}; const updatedAssets = mediaType === 'banner' ? { ...currentAssets, bannerUrl: resultBase64 } : { ...currentAssets, rollBannerUrl: resultBase64 }; const updatedProjectData = { ...p.project_data, printMediaAssets: updatedAssets }; const { data, error } = await supabase.from('projects').update({ project_data: updatedProjectData }).eq('id', projectId).select().single(); if (error) throw error; setProjects(prev => prev.map(proj => proj.id === projectId ? (data as Project) : proj)); showToast(`Template ${mediaType === 'banner' ? 'spanduk' : 'roll banner'} baru berhasil dibuat!`); } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Terjadi kesalahan regenerasi.'); }
    }, [projects, deductCredits, showToast, setProjects]);
    const handleRegenerateMerchandise = useCallback(async (projectId: number) => { const p = projects.find(p => p.id === projectId); if (!p || !p.project_data.selectedLogoUrl) return; const prompt = 'Take the provided logo image. Create a realistic mockup of a plain colored t-shirt on a clean, neutral background. The t-shirt prominently features the logo. The photo is high-quality, commercial-style, showing the texture of the fabric.'; handleRegenerateVisualAsset(projectId, 'merchandiseUrl', 1, async () => { const logoBase64 = await fetchImageAsBase64(p.project_data.selectedLogoUrl); return (await geminiService.generateMerchandiseMockup(prompt, logoBase64))[0]; }, "Mockup merchandise baru berhasil dibuat!"); }, [projects, handleRegenerateVisualAsset]);

    const executeLogout = useCallback(async () => { clearWorkflowState(); sessionStorage.clear(); await authExecuteLogout(); setAppState('dashboard'); setSelectedProjectId(null); }, [authExecuteLogout]);

    const renderContent = () => {
        const workflowData = loadWorkflowState(); const commonProps = { onGoToDashboard: handleReturnToDashboard };
        switch (appState) {
            case 'persona': return <BrandPersonaGenerator onComplete={handlePersonaComplete} {...commonProps} />;
            case 'logo': return workflowData?.selectedPersona && workflowData.brandInputs ? <LogoGenerator persona={workflowData.selectedPersona} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoComplete} {...commonProps} /> : null;
            case 'logo_detail': return workflowData?.selectedLogoUrl && workflowData.logoPrompt && workflowData.brandInputs ? <LogoDetailGenerator baseLogoUrl={workflowData.selectedLogoUrl} basePrompt={workflowData.logoPrompt} businessName={workflowData.brandInputs.businessName} onComplete={handleLogoDetailComplete} {...commonProps} /> : null;
            case 'social_kit': return <SocialMediaKitGenerator projectData={workflowData || {}} onComplete={handleSocialKitComplete} {...commonProps} />;
            case 'profiles': return <ProfileOptimizer projectData={workflowData || {}} onComplete={handleProfilesComplete} {...commonProps} />;
            case 'packaging': return <PackagingGenerator projectData={workflowData || {}} onComplete={handlePackagingComplete} {...commonProps} />;
            case 'print_media': return <PrintMediaGenerator projectData={workflowData || {}} onComplete={handlePrintMediaComplete} {...commonProps} />;
            case 'content_calendar': return <ContentCalendarGenerator projectData={workflowData || {}} onComplete={handleContentCalendarComplete} {...commonProps} />;
            case 'social_ads': return <SocialAdsGenerator projectData={workflowData || {}} onComplete={handleSocialAdsComplete} {...commonProps} />;
            case 'merchandise': return <MerchandiseGenerator projectData={workflowData || {}} onComplete={handleMerchandiseComplete} {...commonProps} />;
            case 'summary': const project = projects.find(p => p.id === selectedProjectId); return project ? <ProjectSummary project={project} onStartNew={handleReturnToDashboard} onGoToCaptionGenerator={handleGoToCaptionGenerator} onGoToInstantContent={handleGoToInstantContent} onDeleteProject={handleRequestDeleteProject} onRegenerateContentCalendar={() => handleRegenerateContentCalendar(project.id)} onRegenerateSocialKit={() => handleRegenerateSocialKit(project.id)} onRegenerateProfiles={() => handleRegenerateProfiles(project.id)} onRegenerateSocialAds={() => handleRegenerateSocialAds(project.id)} onRegeneratePackaging={() => handleRegeneratePackaging(project.id)} onRegeneratePrintMedia={(type) => handleRegeneratePrintMedia(project.id, type)} onRegenerateMerchandise={() => handleRegenerateMerchandise(project.id)} onShareToForum={() => handleShareToForum(project)} addXp={addXp} /> : null;
            case 'caption': return workflowData && selectedProjectId ? <CaptionGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} addXp={addXp} /> : null;
            case 'instant_content': return workflowData && selectedProjectId ? <InstantContentGenerator projectData={workflowData} onBack={() => navigateTo('summary')} {...commonProps} addXp={addXp} /> : null;
            case 'dashboard': default: return <ProjectDashboard projects={projects} onNewProject={handleStartManualProject} onSelectProject={handleSelectProject} onDeleteProject={handleRequestDeleteProject} onPreloadNewProject={preloadBrandPersona} />;
        }
        handleReturnToDashboard(); return <AuthLoadingScreen />;
    };
    
    if (authLoading) return <AuthLoadingScreen />;
    
    if (!session) return ( <> <LoginScreen isCaptchaSolved={!showCaptcha} /> <Suspense fallback={null}> <PuzzleCaptchaModal show={showCaptcha} onSuccess={() => setShowCaptcha(false)} /> <TermsOfServiceModal show={uiToggles.showToSModal} onClose={() => uiToggles.toggleToSModal(false)} /> <PrivacyPolicyModal show={uiToggles.showPrivacyModal} onClose={() => uiToggles.togglePrivacyModal(false)} /> </Suspense> </> );
    
    return (
      <>
        <div className={`min-h-screen bg-background text-text-body transition-all duration-300`}>
            <header className="py-3 px-4 sm:px-6 lg:px-8 bg-surface/80 backdrop-blur-lg sticky top-0 z-20 border-b border-border-main transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 accent-stripes"></div>
                <div className="max-w-7xl mx-auto flex justify-between items-center relative pt-1.5">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider cursor-pointer transition-transform hover:scale-105" onClick={handleReturnToDashboard} style={{fontFamily: 'var(--font-display)'}}>
                        <span className="text-primary">des<span className="text-accent">ai</span>n</span><span className="text-text-header">.fun</span>
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Tooltip
                            content={
                                <div className="text-sm space-y-2">
                                    <h4 className="font-bold text-splash">Sistem Token Mang AI</h4>
                                    <p className="text-xs text-text-body"><strong className="text-text-header">🎁 Bonus Sambutan:</strong> 20 Token GRATIS.</p>
                                    <p className="text-xs text-text-body"><strong className="text-text-header">☀️ Jatah Harian:</strong> Diisi ulang jadi 5 Token tiap pagi jika kurang.</p>
                                    <p className="text-xs text-text-body"><strong className="text-text-header">🚀 Hadiah Naik Level:</strong> Dapat 2-10 Token setiap naik level.</p>
                                    <p className="text-xs text-text-muted mt-2 border-t border-border-main pt-2">Biaya setiap aksi tertera jelas di tombolnya. Transparan!</p>
                                </div>
                            }
                        >
                            <div title="Info Token" className="flex items-center gap-1.5 p-2 rounded-full text-text-muted hover:bg-surface hover:text-text-header transition-colors cursor-help">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-splash" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                <span className="font-bold text-base text-text-header">{profile?.credits ?? 0}</span>
                            </div>
                        </Tooltip>
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        
                        {!aipetContext.isLoading && petState && (
                            <button
                                onClick={() => { playSound('click'); uiToggles.toggleAIPetLab(true); }}
                                title="Buka AIPet Lab"
                                className="flex items-center gap-2 rounded-full p-1 pr-3 bg-background hover:bg-border-light transition-colors border border-border-main group"
                            >
                                <div className="w-9 h-9 flex items-center justify-center relative transition-transform group-hover:scale-110">
                                    {petState.stage === 'active' && petState.blueprint ? (
                                        <div className="absolute inset-0 scale-[1.4] top-1">
                                            <Suspense fallback={<div className="w-full h-full bg-border-main rounded-full animate-pulse" />}>
                                                <AIPetVisual petState={petState} behavior="idle" />
                                            </Suspense>
                                        </div>
                                    ) : (
                                        <div className="text-2xl animate-pulse filter drop-shadow-[0_0_4px_rgb(var(--c-primary))]">💎</div>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-text-header hidden sm:block">
                                    {petState.stage === 'active' ? petState.name : 'AIPod'}
                                </span>
                            </button>
                        )}

                        <div ref={userMenuRef} className="relative">
                            <button onClick={() => setIsUserMenuOpen(p => !p)} title="User Menu" className="flex items-center gap-2 rounded-full p-1 pl-3 bg-background hover:bg-border-light transition-colors border border-transparent hover:border-border-main">
                                <Suspense fallback={null}><HeaderStats profile={profile} /></Suspense>
                                <img src={session.user.user_metadata.avatar_url || ''} alt={session.user.user_metadata.full_name || 'User Avatar'} className="w-9 h-9 rounded-full border-2 border-border-main" />
                            </button>
                            {showXpGain && <div className="xp-gain-animation">+XP!</div>}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-main rounded-lg shadow-lg py-1.5 z-30 animate-content-fade-in">
                                    <div className="px-4 py-3 border-b border-border-main">
                                        <p className="font-bold text-lg text-text-header truncate">{profile?.full_name || ''}</p>
                                        <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-splash" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                            <span className="font-bold text-base text-text-header">{profile?.credits ?? 0}</span> <span className="text-text-muted">Token</span>
                                        </p>
                                    </div>
                                    <a onClick={handleRequestReturnToDashboard} className="cursor-pointer w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background flex items-center gap-3 transition-colors">Dashboard</a>
                                    <a onClick={() => { playSound('click'); setIsUserMenuOpen(false); uiToggles.toggleProfileModal(true); }} className="cursor-pointer w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background transition-colors">Pengaturan & Lencana</a>
                                    <div className="border-t border-border-main my-1"></div>
                                    <a onClick={() => { playSound('click'); setIsUserMenuOpen(false); uiToggles.toggleAboutModal(true); }} className="cursor-pointer w-full text-left px-4 py-2 text-sm text-text-body hover:bg-background transition-colors">Tentang Aplikasi</a>
                                    <a href="https://saweria.co/logoku" target="_blank" rel="noopener noreferrer" onClick={() => setIsUserMenuOpen(false)} className="w-full text-left block px-4 py-2 text-sm text-text-body hover:bg-background transition-colors">Traktir Kopi</a>
                                    <div className="border-t border-border-main my-1"></div>
                                    <a onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">Logout</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main id="main-content" className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
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
             <Footer />
            <AdBanner />
            <Toast message={toast.message} show={toast.show} onClose={closeToast} />
        </div>

        {/* --- Floating Pet Assistant & Panels --- */}
        {user && !aipetContext.isLoading && petState && petState.stage === 'active' && (
            <>
                <FloatingAIPet 
                    petState={petState} 
                    isVisible={isPetOnScreen}
                />
                <Suspense fallback={null}>
                    <AiAssistant petName={petState.name} />
                </Suspense>
            </>
        )}

        {/* Modals and overlays */}
        <Suspense fallback={null}>
            <BrandGalleryModal show={uiToggles.showBrandGalleryModal} onClose={() => uiToggles.toggleBrandGalleryModal(false)} />
            <AIPetLabModal show={uiToggles.showAIPetLab} onClose={() => uiToggles.toggleAIPetLab(false)} />
            <ContactModal show={uiToggles.showContactModal} onClose={() => uiToggles.toggleContactModal(false)} />
            <AboutModal show={uiToggles.showAboutModal} onClose={() => uiToggles.toggleAboutModal(false)} />
            <TermsOfServiceModal show={uiToggles.showToSModal} onClose={() => uiToggles.toggleToSModal(false)} />
            <PrivacyPolicyModal show={uiToggles.showPrivacyModal} onClose={() => uiToggles.togglePrivacyModal(false)} />
            <OutOfCreditsModal show={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
            <ProfileSettingsModal show={uiToggles.showProfileModal} onClose={() => uiToggles.toggleProfileModal(false)} />
            <ConfirmationModal show={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={executeLogout} title="Yakin Mau Logout?" confirmText="Ya, Logout" cancelText="Batal">Progres yang belum final bakal ilang lho. Tetep mau lanjut?</ConfirmationModal>
            <ConfirmationModal show={showDashboardConfirm} onClose={() => setShowDashboardConfirm(false)} onConfirm={confirmAndReturnToDashboard} title="Kembali ke Dashboard?" confirmText="Ya, Kembali" cancelText="Batal">Progres di tahap ini bakal hilang. Yakin mau kembali?</ConfirmationModal>
            <DeleteProjectSliderModal show={showDeleteConfirm} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} isConfirmLoading={isDeleting} projectNameToDelete={projectToDelete?.project_data?.brandInputs?.businessName || 'Project Ini'} projectLogoUrl={projectToDelete?.project_data?.selectedLogoUrl} />
            <LevelUpModal show={showLevelUpModal} onClose={() => setShowLevelUpModal(false)} levelUpInfo={levelUpInfo} />
            <AchievementToast achievement={unlockedAchievement} onClose={() => setUnlockedAchievement(null)} />
            <Sotoshop show={uiToggles.showSotoshop} onClose={() => uiToggles.toggleSotoshop(false)} />
            <VoiceBrandingWizard 
              show={uiToggles.showVoiceWizard} 
              onClose={() => uiToggles.toggleVoiceWizard(false)} 
              onComplete={handleWizardComplete}
              profile={profile}
              deductCredits={deductCredits}
              setShowOutOfCreditsModal={setShowOutOfCreditsModal}
            />
        </Suspense>
      </>
    );
};

const Footer: React.FC = () => {
    const { toggleAboutModal, toggleContactModal, toggleToSModal, togglePrivacyModal } = useUI();
    return (
        <footer className="bg-surface border-t border-border-main text-text-muted">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h3>
                        <p className="text-sm">Studio branding AI untuk UMKM juara. Ubah ide jadi brand siap tanding dalam hitungan menit.</p>
                        <div className="flex space-x-4">
                            <a href="https://www.instagram.com/rangga.p.h" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Instagram Developer">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
                            </a>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-text-header">Navigasi</h4>
                        <ul className="space-y-1 text-sm">
                            <li><button onClick={() => toggleAboutModal(true)} className="hover:text-primary transition-colors">Tentang Aplikasi</button></li>
                            <li><button onClick={() => toggleContactModal(true)} className="hover:text-primary transition-colors">Kontak Developer</button></li>
                            <li><button onClick={() => toggleToSModal(true)} className="hover:text-primary transition-colors">Ketentuan Layanan</button></li>
                            <li><button onClick={() => togglePrivacyModal(true)} className="hover:text-primary transition-colors">Kebijakan Privasi</button></li>
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-text-header">Legal</h4>
                        <p className="text-sm">Aplikasi ini disediakan "sebagaimana adanya". Pengguna bertanggung jawab penuh untuk melakukan pengecekan merek dagang sebelum penggunaan komersial.</p>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-border-main text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} Atharrazka Core oleh Rangga.P.H. Dibangun dengan ❤️ untuk UMKM Indonesia.</p>
                </div>
            </div>
        </footer>
    );
};

export default App;