// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useState } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_BANNER } from '../../services/adsenseConfig';

const AdAnchor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(sessionStorage.getItem('ad_anchor_dismissed') !== 'true');

  useEffect(() => {
    if (isVisible) {
      try {
        // Dorong iklan hanya jika komponen terlihat
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense gagal mendorong iklan:', e);
      }
    }
  }, [isVisible]);

  const handleDismiss = () => {
    sessionStorage.setItem('ad_anchor_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-background/80 backdrop-blur-sm flex justify-center items-center h-[55px] border-t border-border-light shadow-2xl animate-content-fade-in">
      <div className="relative w-full h-full flex items-center justify-center">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', height: '50px', maxWidth: '728px' }}
             data-ad-client={AD_PUBLISHER_ID}
             data-ad-slot={AD_SLOT_ID_BANNER}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <button 
          onClick={handleDismiss} 
          className="absolute top-0 right-0 m-1 px-2 py-0.5 bg-surface/80 text-text-muted text-xs rounded hover:bg-border-light"
          aria-label="Tutup Iklan"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default AdAnchor;