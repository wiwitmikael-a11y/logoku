export interface BrandInputs {
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  competitors: string; 
  // Input untuk media cetak
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
}

export interface LogoVariations {
  main: string;
  icon: string;
  monochrome: string;
}

export interface PrintMediaAssets {
    cardUrl?: string;
    flyerUrl?: string;
    bannerUrl?: string;
    rollBannerUrl?: string;
}

export interface Project {
  id: string;
  createdAt: Date;
  brandInputs: BrandInputs;
  selectedPersona: BrandPersona;
  selectedSlogan: string; 
  selectedLogoUrl: string; 
  logoPrompt: string; 
  logoVariations?: LogoVariations; 
  contentCalendar?: ContentCalendarEntry[]; 
  searchSources?: any[]; 
  selectedPrintMedia?: PrintMediaAssets;
  selectedPackagingUrl?: string;
  selectedMerchandiseUrl?: string;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
}