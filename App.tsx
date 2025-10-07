// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { supabase, supabaseError } from './services/supabaseClient';
import { playSound } from './services/soundService';
import { clearWorkflowState, loadWorkflowState, saveWorkflowState } from './services/workflowPersistence';
import type { Project, ProjectData, BrandInputs, BrandPersona, LogoVariations, ContentCalendarEntry, SocialMediaKitAssets, SocialProfileData, SocialAdsData, PrintMediaAssets, ProjectStatus, Profile, AIPetState } from './types';
import { useAuth } from './contexts/AuthContext';
import { useAIPet } from './contexts/AIPetContext';
import { useUI } from './contexts/UIContext';
import { useUserActions } from './contexts/UserActionsContext';

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
const AchievementToast = React.lazy(() => import('./components/gamification