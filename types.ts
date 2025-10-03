// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import type { User } from '@supabase/supabase-js';

export type { User };

export interface Profile {
  id: string; // Corresponds to Supabase user ID
  credits: number;
  last_credit_reset: string; // Date string in 'YYYY-MM-DD' format
  welcome_bonus_claimed: boolean;
  xp: number;
  level: number;
  achievements: string[];
  total_projects_completed: number;
  last_daily_xp_claim: string; // NEW: Date string for daily XP
  completed_first_steps: string[]; // NEW: Array of wizard steps completed for the first time
  full_name?: string; // Add optional fields from profiles for joins
  avatar_url?: string;
}

export interface BrandInputs {
  businessName: string;
  businessCategory: string; // NEW: Structured input
  businessDetail: string;   // NEW: Structured input
  industry: string;         // Kept for the combined result for downstream components
  targetAudience: string;
  valueProposition: string; 
  competitors: string; 
  contactInfo?: {
    name: string;
    title: string;
    phone: string;
    email: string;
    website: string;
  };
  flyerContent?: {
    headline: string;
    body: string;
    cta: string;
  };
  bannerContent?: {
    headline: string;
    subheadline: string;
  };
  rollBannerContent?: {
    headline: string;
    body: string;
    contact: string;
  };
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

export interface ContentCalendarEntry {
  hari: string;
  tipe_konten: string;
  ide_konten: string;
  draf_caption: string;
  rekomendasi_hashtag: string[];
  imageUrl?: string;
}

export interface LogoVariations {
  main: string;       // The original icon-only logo
  stacked: string;    // Icon with text below
  horizontal: string; // Icon with text beside
  monochrome: string; // The horizontal or stacked version, but in B&W
}

// NEW: Social Media focused types
export interface SocialProfileData {
  instagramBio: string;
  tiktokBio: string;
  marketplaceDescription: string;
}

export interface SocialAd {
  platform: 'Instagram' | 'TikTok';
  adCopy: string;
  hashtags: string[];
}
export type SocialAdsData = SocialAd[];

export interface SocialMediaKitAssets {
  profilePictureUrl: string;
  bannerUrl: string;
}

// NEW: Print Media Assets
export interface PrintMediaAssets {
  businessCardUrl?: string;
  flyerUrl?: string;
  bannerUrl?: string; // a horizontal banner
  rollBannerUrl?: string; // a vertical banner
}


export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
}

// This represents the data structure stored in the 'project_data' JSONB column
export interface ProjectData {
  brandInputs: BrandInputs;
  selectedPersona: BrandPersona;
  selectedSlogan: string; 
  selectedLogoUrl: string; 
  logoPrompt: string; 
  logoVariations?: LogoVariations; 
  contentCalendar?: ContentCalendarEntry[]; 
  searchSources?: any[]; 
  
  // NEW: Replaced old web-focused fields
  socialProfiles?: SocialProfileData;
  socialAds?: SocialAdsData;
  socialMediaKit?: SocialMediaKitAssets;

  selectedPackagingUrl?: string;
  printMediaAssets?: PrintMediaAssets;
  merchandiseUrl?: string;
}

// This represents a project row fetched from the Supabase 'projects' table
// FIX: Add 'local-complete' to the ProjectStatus type to resolve the TypeScript error.
export type ProjectStatus = 'in-progress' | 'completed' | 'local-complete';

export interface Project {
  id: number; // The database primary key
  user_id: string;
  created_at: string; // The database timestamp
  project_data: ProjectData; // All the branding data is nested here
  status: ProjectStatus; 
  like_count: number; // NEW: For gallery upvotes
}

// --- NEW: Forum Types ---
export interface ForumPost {
  id: string;
  created_at: string;
  user_id: string;
  thread_id: string;
  content: string;
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface ForumThread {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  content: string;
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
  posts: ForumPost[]; // replies
  reply_count?: number; // Optional, can be fetched via RPC
}