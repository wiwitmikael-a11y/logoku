// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// From AuthContext, Supabase
export interface UserProfile {
  id: string;
  updated_at: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  level: number;
  xp: number;
  achievements: string[];
  is_muted: boolean;
  language: 'id' | 'en';
}

// From BrandPersonaGenerator
export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitorAnalysis: string | null;
  businessDetail: string | null;
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi_singkat: string;
  gaya_bicara: string;
  palet_warna_hex: string[];
  keywords: string[];
  inspirasi_visual: string;
}

// From SocialMediaKitGenerator
export interface SocialMediaKit {
  profilePictureUrl: string;
  bannerUrl: string;
}

export interface SocialProfiles {
  instagramBio: string;
  tiktokBio: string;
  marketplaceDescription: string;
}

// From ContentCalendarGenerator
export interface ContentCalendarEntry {
    hari: string;
    tipe_konten: string;
    ide_konten: string;
    draf_caption: string;
    hashtag: string[];
}

export interface CalendarSource {
    web?: {
        uri: string;
        title: string;
    };
}

// From Sotoshop modules
export interface SotoshopPattern {
    url: string;
    prompt: string;
}

export interface SotoshopProductPhoto {
    url: string;
    prompt: string;
}

export interface SotoshopSceneMix {
    url: string;
    prompt: string;
}

export interface SotoshopMoodboard {
    description: string;
    palette: string[];
    images: string[];
}

export interface SotoshopAssets {
  mascots?: string[];
  patterns?: SotoshopPattern[];
  productPhotos?: SotoshopProductPhoto[];
  sceneMixes?: SotoshopSceneMix[];
  moodboards?: SotoshopMoodboard[];
}


// Main Project Data Structure
export interface ProjectData {
  brandInputs: BrandInputs;
  brandPersonas: BrandPersona[];
  selectedPersona: BrandPersona | null;
  slogans: string[];
  selectedSlogan: string | null;
  logoPrompts: string[];
  logoUrls: string[];
  selectedLogoUrl: string | null;
  logoVariations: {
    main?: string;
    stacked?: string;
    horizontal?: string;
    monochrome?: string;
  } | null;
  socialMediaKit: SocialMediaKit | null;
  socialProfiles: SocialProfiles | null;
  contentCalendar: ContentCalendarEntry[] | null;
  calendarSources: CalendarSource[] | null;
  sotoshop_assets: SotoshopAssets | null;
}

export interface Project {
  id: string;
  user_id: string;
  created_at: string;
  project_name: string;
  project_data: ProjectData;
}

// Gamification types
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
