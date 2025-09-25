import React, { useEffect, useRef } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_IN_CONTENT } from '../../services/adsenseConfig';

/**
 * Komponen untuk menampilkan iklan Display responsif di dalam feed/konten.
 * Ini lebih andal daripada "In-feed" untuk aplikasi React yang dirender di sisi klien.
 */
const InFeedAd: React.FC = () => {
  const adPushed = useRef(false);

  useEffect(() => {
    if (adPushed.current) return;
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        adPushed.current = true;
      }
    } catch (err) {
      console.error("AdSense In-Content push error:", err);
    }
  }, []);
  
  // Jika slot ID belum diganti, tampilkan pesan placeholder.
  if (AD_SLOT_ID_IN_CONTENT === "YOUR_DISPLAY_AD_SLOT_ID_HERE") {
    return (
        <div className="bg-gray-800 border border-dashed border-gray-600 rounded-xl p-4 text-center text-sm text-gray-400 min-h-[250px] flex flex-col justify-center items-center">
            <p className="font-semibold text-yellow-400">Slot Iklan Display</p>
            <p>Admin, buat unit iklan "Display" baru di AdSense dan masukkan slot ID-nya di `services/adsenseConfig.ts`</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 w-full h-full min-h-[250px] flex flex-col justify-center items-center">
        <span className="text-[10px] text-gray-500 self-start mb-2">Advertisement</span>
        <ins 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={AD_PUBLISHER_ID}
            data-ad-slot={AD_SLOT_ID_IN_CONTENT}
            data-ad-format="auto"
            data-full-width-responsive="true">
        </ins>
    </div>
  );
};

export default InFeedAd;