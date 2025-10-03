// services/adsenseConfig.ts

// ID Publisher AdSense Anda
export const AD_PUBLISHER_ID = process.env.VITE_AD_PUBLISHER_ID || "ca-pub-6110736010099308";

// ID Slot untuk Smart Banner yang nempel di bawah (Anchor Ad)
export const AD_SLOT_ID_BANNER = process.env.VITE_AD_SLOT_ID_BANNER || "5474214451";

// ID Slot untuk Iklan Display yang muncul di sela-sela konten di Dashboard
// PENTING: Anda harus membuat unit iklan "Display ad" (Iklan Tampilan) baru di akun AdSense Anda,
// pastikan tipenya RESPONSIVE, dan ganti ID placeholder di bawah ini.
export const AD_SLOT_ID_IN_CONTENT = process.env.VITE_AD_SLOT_ID_IN_CONTENT || "3997085444";