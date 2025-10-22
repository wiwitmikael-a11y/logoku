// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added full content for src/types.ts to define all data structures.
import type { Video } from '@google/genai';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  level: number;
  xp: number;
  achievements: string[];
  language: 'id' | 'en';
}

export interface Project {
  id: string;
  user_id: string;
  project_data: ProjectData;
  created_at: string;
}

export interface BrandInputs {
  businessName: string;
  businessDetail: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi: string;
  gaya_bicara: string;
  palet_warna: { nama: string; hex: string }[];
}

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

export interface ContentCalendar {
  plan: ContentCalendarEntry[];
  sources: { uri: string; title: string }[];
}

export interface VideoAsset {
  id: string;
  prompt: string;
  videoUrl: string;
  apiReference?: Video; 
}

export interface AiPresenterAsset {
  id: string;
  characterUrl: string;
  script: string;
  audioUrl: string;
}

export interface PatternAsset {
  url: string;
  prompt: string;
}

export interface PhotoStudioAsset {
  url: string;
  prompt: string;
}

export interface SceneMixAsset {
  url: string;
  prompt: string;
}

export interface MoodboardAsset {
  description: string;
  palette: string[];
  images: string[];
}

export interface SotoshopAssets {
  mascots?: string[];
  videos?: VideoAsset[];
  aiPresenter?: AiPresenterAsset[];
  moodboards?: MoodboardAsset[];
  patterns?: PatternAsset[];
  photoStudio?: PhotoStudioAsset[];
  sceneMixes?: SceneMixAsset[];
}

export interface ProjectData {
  project_name: string;
  brandInputs: BrandInputs | null;
  personas: BrandPersona[];
  selectedPersona: BrandPersona | null;
  slogans: string[];
  selectedSlogan: string | null;
  logoPrompt: string | null;
  logoOptions: string[];
  selectedLogoUrl: string | null;
  socialMediaKit: SocialMediaKit | null;
  socialProfiles: SocialProfiles | null;
  contentCalendar: ContentCalendar | null;
  sotoshop_assets?: SotoshopAssets;
}

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
    action: string;
}

export interface LeaderboardUser {
    id: string;
    full_name: string;
    avatar_url: string;
    level: number;
    xp: number;
}
