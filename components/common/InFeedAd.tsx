import React, { useEffect, useRef } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_IN_CONTENT } from '../../services/adsenseConfig';

const InFeedAd = () => {
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
  
  if (!AD_SLOT_ID_IN_CONTENT) {
    return (
        <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-500 min-h-[120px] flex flex-col justify-center items-center">
            <p className="font-semibold text-orange-500">Slot Iklan Display</p>
            <p>Admin, buat unit iklan "Display" baru di AdSense dan masukkan slot ID-nya di `services/adsenseConfig.ts`</p>
        </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 w-full h-full min-h-[120px] flex flex-col justify-center items-center">
        <span className="text-[10px] text-slate-400 self-start mb-2">Advertisement</span>
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