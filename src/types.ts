// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { User } from '@supabase/supabase-js';

// --- CORE DATA STRUCTURES ---

export interface UserProfile extends User {
  id: string;
  email?: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  level: number;
  xp: number;
  achievements: string[];
  is_muted: boolean;
  language: 'id' | 'en';
}

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  created_at: string;
  is_public: boolean;
  project_data: ProjectData;
}

export interface BrandInputs {
  businessName: string;
  businessDetail: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitorAnalysis: string;
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi: string;
  gaya_bicara: string;
  palet_warna: { hex: string, nama: string }[];
  visual_style: string;
}

// --- PROJECT DATA & ASSETS ---
// ProjectData now stores URLs instead of base64 strings for assets.

export interface SocialMediaKit {
  profilePictureUrl: string;
  bannerUrl: string;
}

export interface SocialProfiles {
  instagramBio: string;
  tiktokBio: string;
  marketplaceDescription: string;
}

export interface ContentCalendarEntry {
  day: string;
  contentType: string;
  idea: string;
  caption: string;
  hashtags: string;
}

export interface SotoshopAssets {
  mascots?: string[]; // URLs
  moodboards?: { description: string; palette: string[]; images: string[] }[]; // URLs in images
  patterns?: { url: string; prompt: string }[]; // URL
  photoStudio?: { url: string; prompt: string }[]; // URL
  sceneMixes?: { url: string; prompt: string }[]; // URL
  videos?: VideoAsset[];
  aiPresenter?: AiPresenterAsset[];
}

export interface AiPresenterAsset {
  id: string;
  characterUrl: string;
  script: string;
  audioUrl: string; // URL to the audio file
}

export interface VideoAsset {
  id: string;
  prompt: string;
  videoUrl: string; // URL to the video file
  thumbnailUrl?: string; // Optional thumbnail
  apiReference?: any; // To store the video object needed for extending
}

export interface ProjectData {
  brandInputs: BrandInputs | null;
  slogans: string[];
  selectedSlogan: string | null;
  logoPrompt: string | null;
  logoOptions: string[]; // URLs
  selectedLogoUrl: string | null;
  logoVariations: string[]; // URLs
  brandPersonas: BrandPersona[];
  selectedPersona: BrandPersona | null;
  socialMediaKit: SocialMediaKit | null;
  socialProfiles: SocialProfiles | null;
  contentCalendar: {
    plan: ContentCalendarEntry[];
    sources: { title: string; uri: string }[];
  } | null;
  sotoshop_assets?: SotoshopAssets;
}

// --- GAMIFICATION & COMMUNITY ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface LevelUpInfo {
  newLevel: number;
  reward: string;
}

export interface DailyMission {
  id: string;
  description: string;
  xp: number;
  token?: number;
  isCompleted: boolean;
  action: 'CREATE_PROJECT' | 'USE_SOTOSHOP' | 'SAVE_ASSET' | 'GENERATE_LOGO' | 'COMPLETE_PERSONA';
}

export interface PublicProject extends Project {
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export interface LeaderboardUser {
    id: string;
    full_name: string;
    avatar_url: string;
    level: number;
    xp: number;
}
