// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_BANNER } from '../../services/adsenseConfig';

interface Props {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'display' | 'in-article';
  responsive?: boolean;
  className?: string;
}

const AdsenseBanner: React.FC<Props> = ({
  slotId = AD_SLOT_ID_BANNER,
  format = 'auto',
  responsive = true,
  className = '',
}) => {
  useEffect(() => {
    try {
      // This is window.adsbygoogle
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('Adsense error:', e);
    }
  }, []);

  // If no publisher ID, don't render anything
  if (!AD_PUBLISHER_ID) {
    return null;
  }
  
  // In development, you might want to show a placeholder
  if (import.meta.env.DEV) {
    return (
      <div className={`adsense-placeholder ${className} flex items-center justify-center bg-gray-200 text-gray-500`}>
        <p>Ad Placeholder ({slotId})</p>
      </div>
    );
  }

  return (
    <div className={`adsense-banner-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      ></ins>
    </div>
  );
};

export default AdsenseBanner;
