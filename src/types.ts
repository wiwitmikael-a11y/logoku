// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// From Supabase Auth
export interface User {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

// Our custom Profile table
export interface Profile {
  id: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  last_credit_reset: string;
  welcome_bonus_claimed: boolean;
  level: number;
  xp: number;
  achievements: string[];
  language: 'id' | 'en';
  aipet_state: AIPetState | null;
}

export interface AIPetState {
  name: string;
  species: string;
  stage: 'aipod' | 'child' | 'teen' | 'adult';
  image_url: string;
  xp: number;
  level: number;
}


// Brand Persona & Inputs
export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitorAnalysis?: string;
  businessDetail?: string;
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi_singkat: string;
  kata_kunci: string[];
  palet_warna_hex: string[];
  customer_avatars: CustomerAvatar[];
  brand_voice: BrandVoice;
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

export interface GeneratedCaption {
    caption: string;
    hashtags: string[];
}

export interface ContentCalendarEntry {
    hari: string;
    tipe_konten: string;
    ide_konten: string;
    draf_caption: string;
    rekomendasi_hashtag: string[];
}

export type SocialAdsData = SocialAd[];

export interface SocialAd {
  platform: "Instagram" | "TikTok";
  adCopy: string;
  hashtags: string[];
}


// Main Project Data Structure
export interface ProjectData {
  brandInputs: BrandInputs | null;
  brandPersonas: BrandPersona[];
  selectedPersona: BrandPersona | null;
  slogans: string[];
  selectedSlogan: string | null;
  logoPrompt: string | null;
  logoOptions: string[];
  selectedLogoUrl: string | null;
  logoVariations: LogoVariations | null;
  socialMediaKit: SocialMediaKitAssets | null;
  socialProfiles: SocialProfileData | null;
}


// Supabase Project table
export interface Project {
  id: string;
  user_id: string;
  created_at: string;
  project_name: string;
  project_data: ProjectData;
}

// For LevelUpModal
export interface LevelUpInfo {
  newLevel: number;
  reward: string;
}

// For AchievementToast
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}
