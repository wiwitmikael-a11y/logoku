import React, { useEffect, useRef, useState } from 'react';

// --- Konfigurasi AdSense ---
// ID ini harus sesuai dengan yang ada di akun AdSense lo.
const AD_PUBLISHER_ID = "ca-pub-6110736010099308";
const AD_SLOT_ID = "5474214451";

/**
 * AdBanner "Pintar" yang seimbang antara UX dan Monetisasi.
 * - Hanya muncul jika iklan berhasil dimuat, menghindari kotak kosong.
 * - Secara dinamis menyesuaikan layout konten utama agar tidak tumpang tindih.
 * - Menggunakan MutationObserver untuk deteksi iklan yang andal.
 */
const AdBanner: React.FC = () => {
  const adPushed = useRef(false);
  const adInsRef = useRef<HTMLModElement>(null);
  const [isAdVisible, setIsAdVisible] = useState(false);

  // Effect untuk mendorong iklan dan menyiapkan observer
  useEffect(() => {
    if (!AD_SLOT_ID || adPushed.current || !adInsRef.current) {
      return;
    }

    const insElement = adInsRef.current;
    
    // Observer untuk mendeteksi kapan AdSense memodifikasi tag <ins>
    const observer = new MutationObserver(() => {
        // Cek apakah iframe (iklan) sudah ditambahkan atau statusnya 'unfilled'
        const adLoaded = insElement.querySelector('iframe') !== null;
        const adUnfilled = insElement.getAttribute('data-ad-status') === 'unfilled';

        if (adLoaded) {
          setIsAdVisible(true);
          observer.disconnect(); // Berhenti mengamati setelah iklan dimuat
        } else if (adUnfilled) {
          setIsAdVisible(false);
          observer.disconnect(); // Berhenti mengamati jika tidak ada iklan
        }
    });

    observer.observe(insElement, {
      childList: true, // Amati penambahan/penghapusan anak (misal: iframe)
      attributes: true, // Amati perubahan atribut
      attributeFilter: ['data-ad-status'], // Fokus pada atribut status dari AdSense
    });

    // Dorong iklan ke Google setelah jeda singkat untuk memastikan DOM siap
    const timeoutId = setTimeout(() => {
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            adPushed.current = true;
        } catch (err) {
            console.error("AdSense push error:", err);
            observer.disconnect();
        }
    }, 100);
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Effect untuk menyesuaikan padding konten utama berdasarkan visibilitas iklan
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (isAdVisible) {
      // Tinggi banner iklan 50px + 24px padding asli = 74px
      mainContent.style.paddingBottom = '74px';
    } else {
      // Kembalikan ke padding asli jika tidak ada iklan
      mainContent.style.paddingBottom = '24px';
    }
    
    // Cleanup saat komponen dibongkar
    return () => {
        if(mainContent) {
            mainContent.style.paddingBottom = '24px';
        }
    };
  }, [isAdVisible]);

  // Jangan render apapun jika slot ID tidak ada
  if (!AD_SLOT_ID) {
    return null;
  }
  
  return (
    <div 
      className={`
        fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 z-20 
        flex justify-center items-center transition-all duration-300 ease-in-out
        ${isAdVisible ? 'h-[50px] opacity-100' : 'h-0 opacity-0 pointer-events-none'}
      `}
      aria-hidden={!isAdVisible}
      role="complementary"
    >
      <div className="w-full max-w-4xl text-center relative flex items-center justify-center h-full">
        <ins 
            ref={adInsRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '50px' }}
            data-ad-client={AD_PUBLISHER_ID}
            data-ad-slot={AD_SLOT_ID}>
        </ins>
        {isAdVisible && (
            <span className="text-[10px] text-gray-600 absolute top-0 left-2 bg-gray-900 px-1 rounded-b-sm">Advertisement</span>
        )}
      </div>
    </div>
  );
};

export default AdBanner;