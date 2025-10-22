// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback function whenever the page/tab regains focus
 * or becomes visible after being hidden. This is crucial for re-validating state
 * that might become stale when a tab is backgrounded by the browser.
 *
 * @param onFocus - The callback function to execute when the page becomes active.
 */
export const usePageFocusTrigger = (onFocus: () => void) => {
  useEffect(() => {
    // The 'visibilitychange' event is the modern standard for detecting tab visibility.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onFocus();
      }
    };

    // The 'focus' event on window is a good fallback and catches cases where
    // the window itself gains focus.
    const handleFocus = () => {
        onFocus();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners when the component unmounts.
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onFocus]); // Re-run the effect if the callback function changes.
};