// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitorAnalysis: string | null;
  businessDetail: string | null;
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

export interface SotoshopAssets {
  mascots?: string[];
  patterns?: { url: string; prompt: string }[];
  moodboards?: { description: string; palette: string[]; images: string[] }[];
  productPhotos?: { url: string; prompt: string }[];
  sceneMixes?: { url: string; prompt: string }[];
  videos?: { url: string; prompt: string }[];
}


export interface ProjectData {
  brandInputs: BrandInputs | null;
  brandPersonas: BrandPersona[];
  selectedPersona: BrandPersona | null;
  slogans: string[];
  selectedSlogan: string | null;
  logoPrompt: string | null;
  logoStyle: string | null; // Added for the new logo wizard
  logoPaletteName: string | null; // Added for the new logo wizard
  logoOptions: string[];
  selectedLogoUrl: string | null;
  logoVariations: LogoVariations | null;
  socialMediaKit: SocialMediaKitAssets | null;
  socialProfiles: SocialProfileData | null;
  sotoshop_assets?: SotoshopAssets;
  contentCalendar?: ContentCalendarEntry[];
  calendarSources?: any[];
}

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  project_data: ProjectData;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  level: number;
  xp: number;
  achievements: string[];
  language: 'id' | 'en';
  is_muted: boolean;
  updated_at: string;
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

export interface AIPetState {
  name: string;
  species: string;
  stage: 'egg' | 'baby' | 'adult';
  image_url: string;
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
  hashtag: string[];
}

export type SocialAdsData = SocialAd[];

export interface SocialAd {
  platform: "Instagram" | "TikTok";
  adCopy: string;
  hashtags: string[];
}