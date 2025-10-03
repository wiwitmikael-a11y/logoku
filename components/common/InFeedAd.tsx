import React, { useEffect, useRef } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_IN_CONTENT } from '../../services/adsenseConfig';

const InFeedAd = () => {
  const adPushed = useRef(false);

  useEffect(() => {
    if (adPushed.current) return;
    try {
      if (typeof window !== 'undefined') { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); adPushed.current = true; }
    } catch (err) { console.error("AdSense In-Content push error:", err); }
  }, []);
  
  if (!AD_SLOT_ID_IN_CONTENT) {
    return (
        <div className="bg-background border border-dashed border-border-main rounded-xl p-4 text-center text-sm text-text-muted min-h-[120px] flex flex-col justify-center items-center">
            <p className="font-semibold text-accent">Slot Iklan Display</p>
            <p>Admin, buat unit iklan "Display" baru di AdSense dan masukkan slot ID-nya di `services/adsenseConfig.ts`</p>
        </div>
    );
  }

  return (
    <div className="bg-surface border border-border-main rounded-xl p-4 w-full h-full min-h-[120px] flex flex-col justify-center items-center">
        <span className="text-[10px] text-text-muted self-start mb-2">Advertisement</span>
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