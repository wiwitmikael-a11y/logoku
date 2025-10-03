import React, { useEffect, useRef, useState } from 'react';
import { AD_PUBLISHER_ID, AD_SLOT_ID_BANNER } from '../services/adsenseConfig';

const AdBanner: React.FC = () => {
  const adPushed = useRef(false);
  const adInsRef = useRef<HTMLModElement>(null);
  const [isAdVisible, setIsAdVisible] = useState(false);

  useEffect(() => {
    if (!AD_SLOT_ID_BANNER || adPushed.current || !adInsRef.current) {
      return;
    }

    const insElement = adInsRef.current;
    
    const observer = new MutationObserver(() => {
        const adLoaded = insElement.querySelector('iframe') !== null;
        const adUnfilled = insElement.getAttribute('data-ad-status') === 'unfilled';

        if (adLoaded) {
          setIsAdVisible(true);
          observer.disconnect();
        } else if (adUnfilled) {
          setIsAdVisible(false);
          observer.disconnect();
        }
    });

    observer.observe(insElement, {
      childList: true,
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    const timeoutId = setTimeout(() => {
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            adPushed.current = true;
        } catch (err) {
            console.error("AdSense push error:", err);
            observer.disconnect();
        }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (isAdVisible) {
      mainContent.style.paddingBottom = '74px'; // 50px ad height + 24px padding
    } else {
      mainContent.style.paddingBottom = '24px'; // Original padding
    }
    
    return () => {
        if(mainContent) {
            mainContent.style.paddingBottom = '24px';
        }
    };
  }, [isAdVisible]);

  if (!AD_SLOT_ID_BANNER) {
    return null;
  }
  
  return (
    <div 
      className={`
        fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 z-20 
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
            data-ad-slot={AD_SLOT_ID_BANNER}>
        </ins>
        {isAdVisible && (
            <span className="text-[10px] text-slate-400 absolute top-0 left-2 bg-white/80 px-1 rounded-b-sm">Advertisement</span>
        )}
      </div>
    </div>
  );
};

export default AdBanner;