import React from 'react';

/**
 * AdBanner component configured for a fixed-size ad unit.
 * The height is set to 50px to match the user's AdSense unit, resolving display issues.
 */
const AdBanner: React.FC = () => {
  // User-provided AdSense IDs.
  const AD_PUBLISHER_ID = "ca-pub-6110736010099308";
  const AD_SLOT_ID = "5474214451"; 

  // Check if the Ad Slot ID is valid.
  const isAdSlotSet = !!AD_SLOT_ID;
  const adPushed = React.useRef(false);

  React.useEffect(() => {
    // Only run the AdSense script if the Ad Slot ID is set and the ad hasn't been pushed yet.
    if (isAdSlotSet && !adPushed.current) {
      // Mark that we are attempting to push the ad to prevent duplicates.
      adPushed.current = true;

      // A brief delay (100ms) helps ensure the ad container is rendered by the browser,
      // preventing "No slot size for availableWidth=0" errors.
      const timeout = setTimeout(() => {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (err) {
          console.error("AdSense error:", err);
        }
      }, 100);

      // Cleanup function to clear the timeout if the component unmounts before it runs.
      return () => clearTimeout(timeout);
    }
  }, [isAdSlotSet]);

  // The container's height is now dictated by the <ins> tag's 50px height.
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 z-20 flex justify-center items-center">
      <div className="w-full max-w-4xl text-center relative flex items-center justify-center">
        {isAdSlotSet ? (
          <>
            <ins className="adsbygoogle"
                 // Using a fixed 50px height to match the user's likely AdSense unit configuration.
                 // Removed responsive attributes like data-ad-format and data-full-width-responsive.
                 style={{ display: 'block', width: '100%', height: '50px' }}
                 data-ad-client={AD_PUBLISHER_ID}
                 data-ad-slot={AD_SLOT_ID}></ins>
            <span className="text-[10px] text-gray-600 absolute top-0 left-2 bg-gray-900 px-1 rounded-b-sm">Advertisement</span>
          </>
        ) : (
          // This fallback is kept just in case.
          <div className="text-yellow-400 bg-yellow-900/50 p-3 rounded-lg text-sm">
            <strong>Penting:</strong> Konfigurasi Ad Slot ID di <code>components/AdBanner.tsx</code> belum lengkap.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;