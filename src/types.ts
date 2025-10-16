// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// Supabase auth types
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface User {
  id: string;
  email?: string;
  user_metadata: {
    [key: string]: any;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Application-specific types
export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  businessDetail: string;
  competitorAnalysis?: string | null;
  competitorUrl?: string | null;
}

export interface CustomerAvatar {
    nama_avatar: string;
    deskripsi_demografis: string;
    pain_points: string[];
    media_sosial: string[];
}

export interface BrandVoice {
    deskripsi: string;
    kata_yang_digunakan: string[];
    kata_yang_dihindari: string[];
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi_singkat: string;
  kata_kunci: string[];
  palet_warna_hex: string[];
  customer_avatars: CustomerAvatar[];
  brand_voice: BrandVoice;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
}

export interface ContentCalendarEntry {
  hari: string;
  tipe_konten: string;
  ide_konten: string;
  draf_caption: string;
  hashtags: string[];
}

export interface LogoVariations {
  main: string;
  stacked: string;
  horizontal: string;
  monochrome: string;
}

export interface SocialMediaKitAssets {
  profilePictureUrl: string;
  bannerUrl: string;
}

export interface SocialProfileData {
  instagramBio: string;
  tiktokBio: string;
  marketplaceDescription: string;
}

export type SocialAdsData = {
    platform: "Instagram" | "TikTok";
    adCopy: string;
    hashtags: string[];
}[];


export interface ProjectData {
  brandInputs: BrandInputs;
  brandPersonas?: BrandPersona[];
  selectedPersona?: BrandPersona;
  slogans?: string[];
  selectedSlogan?: string;
  logoPrompt?: string;
  logoStyle?: string;
  logoOptions?: string[];
  selectedLogoUrl?: string;
  logoVariations?: LogoVariations;
  socialMediaKit?: SocialMediaKitAssets;
  socialProfiles?: SocialProfileData;
  captions?: GeneratedCaption[];
  contentCalendar?: ContentCalendarEntry[];
  socialAds?: SocialAdsData;
  packagingDesigns?: string[];
  printMedia?: string[];
  merchandise?: string[];
  moodboard?: {
    description: string;
    palette: string[];
    images: string[];
  };
  pattern?: {
    url: string;
    prompt: string;
  };
  mascot?: {
    urls: string[];
  };
  photoStudio?: {
    url: string;
    prompt: string;
    original: string | null;
  };
  sceneMixer?: {
    url: string;
    prompt: string;
    images: { src: string; instruction: string }[];
  };
}

export interface Project {
  id: number;
  user_id: string;
  project_name: string;
  project_data: ProjectData;
  created_at: string;
}

export interface AIPetState {
  stage: 'aipod' | 'baby' | 'child' | 'adult';
  name: string;
  species: string;
  backstory: string;
  evolution_progress: number;
  last_fed: string; // ISO date string
  last_interacted: string; // ISO date string
  stats: {
    creativity: number;
    logic: number;
    humor: number;
  };
  image_url: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  level: number;
  xp: number;
  total_projects_completed: number;
  achievements: string[];
  welcome_bonus_claimed: boolean;
  last_credit_reset: string; // ISO date string
  completed_first_steps: string[];
  daily_actions: DailyActions | null;
  aipet_state: AIPetState | null;
  language?: 'id' | 'en';
}

export interface DailyActions {
  last_updated: string; // ISO date string
  actions: { [key: string]: number };
  claimed_missions: string[];
}
