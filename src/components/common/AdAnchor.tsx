// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_BANNER } from '../../services/adsenseConfig';

const AdAnchor: React.FC = () => {
  useEffect(() => {
    try {
      if ((window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense gagal mendorong iklan:', e);
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-background flex justify-center items-center h-[50px] sm:h-auto border-t border-border-light shadow-2xl">
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', height: '50px' }}
           data-ad-client={AD_PUBLISHER_ID}
           data-ad-slot={AD_SLOT_ID_BANNER}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdAnchor;
