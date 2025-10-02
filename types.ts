// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import type { User } from '@supabase/supabase-js';

export type { User };

export interface Profile {
  id: string; // Corresponds to Supabase user ID
  credits: number;
  last_credit_reset: string; // Date string in 'YYYY-MM-DD' format
  welcome_bonus_claimed: boolean; // NEW: To track one-time welcome bonus
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
}

// This represents a project row fetched from the Supabase 'projects' table
export type ProjectStatus = 'in-progress' | 'local-complete' | 'completed';

export interface Project {
  id: number; // The database primary key
  user_id: string;
  created_at: string; // The database timestamp
  project_data: ProjectData; // All the branding data is nested here
  status: ProjectStatus; 
}
