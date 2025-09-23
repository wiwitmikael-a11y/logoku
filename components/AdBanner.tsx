import React, { useEffect } from 'react';

// Ganti nilai placeholder ini dengan Ad Slot ID asli dari akun AdSense kamu.
const AD_SLOT_ID = "XXXXXXXXXX"; // <--- GANTI DI SINI

const AdBanner: React.FC = () => {
  // Cek apakah Ad Slot ID sudah diganti dari placeholder.
  const isAdSlotSet = AD_SLOT_ID !== "XXXXXXXXXX" && AD_SLOT_ID;

  useEffect(() => {
    // Hanya jalankan skrip AdSense jika Ad Slot ID sudah diganti.
    if (isAdSlotSet) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [isAdSlotSet]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 z-20 flex justify-center items-center p-2">
      <div className="w-full max-w-4xl text-center relative min-h-[60px] flex items-center justify-center">
        {isAdSlotSet ? (
          <>
            {/* Unit Iklan AdSense akan muncul di sini */}
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%' }}
                 data-ad-slot={AD_SLOT_ID}
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <span className="text-[10px] text-gray-600 absolute top-0 left-2 bg-gray-900 px-1 rounded-b-sm">Advertisement</span>
          </>
        ) : (
          // Pesan untuk developer jika Ad Slot ID belum di-set.
          <div className="text-yellow-400 bg-yellow-900/50 p-3 rounded-lg text-sm">
            <strong>Penting:</strong> Iklan belum aktif. Buka file <code>components/AdBanner.tsx</code> dan ganti placeholder <code>AD_SLOT_ID</code> dengan Ad Slot ID asli dari akun AdSense lo.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;