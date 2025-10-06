// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitors: string;
  businessCategory: string;
  businessDetail: string;
}

export interface BrandPersona {
  nama_persona: string;
  deskripsi_singkat: string;
  kata_kunci: string[];
  palet_warna_hex: string[];
  customer_avatars: {
    nama_avatar: string;
    deskripsi_demografis: string;
    pain_points: string[];
    media_sosial: string[];
  }[];
  brand_voice: {
    deskripsi: string;
    kata_yang_digunakan: string[];
    kata_yang_dihindari: string[];
  };
}

export interface LogoVariations {
  main: string;
  stacked: string;
  horizontal: string;
  monochrome: string;
}

export interface ContentCalendarEntry {
  hari: string;
  tipe_konten: string;
  ide_konten: string;
  draf_caption: string;
  rekomendasi_hashtag: string[];
  imageUrl?: string;
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

export interface PrintMediaAssets {
  bannerUrl?: string;
  rollBannerUrl?: string;
}

export interface ProjectData {
  brandInputs: BrandInputs;
  selectedPersona: BrandPersona;
  selectedSlogan: string;
  logoPrompt: string;
  selectedLogoUrl: string;
  logoVariations: LogoVariations;
  socialMediaKit: SocialMediaKitAssets;
  socialProfiles: SocialProfileData;
  selectedPackagingUrl: string;
  printMediaAssets: PrintMediaAssets;
  contentCalendar: ContentCalendarEntry[];
  searchSources?: any[];
  socialAds: SocialAdsData;
  merchandiseUrl: string;
}

export type ProjectStatus = 'in-progress' | 'completed';

export interface Project {
  id: number;
  user_id: string;
  created_at: string;
  project_data: Partial<ProjectData>;
  status: ProjectStatus;
  like_count?: number;
}

export type AIPetPersonalityVector = {
  minimalist: number;
  rustic: number;
  playful: number;
  modern: number;
  luxury: number;
  feminine: number;
  bold: number;
  creative: number;
};

export interface AIPetStats {
  energy: number;
  creativity: number;
  intelligence: number;
  charisma: number;
}

export type AIPetTier = 'common' | 'epic' | 'legendary' | 'mythic';
export type AIPetStage = 'aipod' | 'active';

// --- New Blueprint System Types ---
export interface AIPetBlueprint {
  url: string; // e.g., 'Common_Beast.png'
}

export interface AIPetColorPalette {
  base: string;
  highlight: string;
  shadow: string;
}

export interface AIPetColors {
  organic: AIPetColorPalette;
  mechanical: AIPetColorPalette;
  energy: AIPetColorPalette;
}

export interface AIPetBattleStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface AIPetState {
  name: string;
  stage: AIPetStage;
  tier: AIPetTier;
  stats: AIPetStats; // This is now "personality stats"
  lastFed: number;
  lastPlayed: number;
  personality: AIPetPersonalityVector;
  narrative: string | null; // Re-added for origin story/lore
  
  // New battle system
  battleStats: AIPetBattleStats | null;
  buffs: string[];

  // New blueprint system
  blueprint: AIPetBlueprint | null;
  colors: AIPetColors | null;
}

export interface DailyActions {
  claimed_missions?: string[];
  [actionId: string]: number | string[] | undefined;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  last_credit_reset: string;
  welcome_bonus_claimed: boolean;
  xp: number;
  level: number;
  achievements: string[];
  total_projects_completed: number;
  last_daily_xp_claim: string;
  completed_first_steps: string[];
  aipet_state?: AIPetState | null;
  aipet_pity_counter?: number;
  data_fragments?: number;
  daily_actions?: DailyActions | null;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
}

export interface ForumThread {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  content: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  posts: ForumPost[];
  reply_count?: number;
}

export interface ForumPost {
  id: string;
  created_at: string;
  user_id: string;
  thread_id: string;
  content: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Replicating Supabase types to avoid direct dependency in all files
export interface User {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Session {
  user: User;
  [key: string]: any;
}
