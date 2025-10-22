// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useEffect } from 'react';
import { getAudioContext, resumeAudioContext } from '../services/soundService';

/**
 * A hook to manage the global AudioContext lifecycle.
 * It ensures the AudioContext is resumed from a suspended state
 * upon the first user interaction, complying with modern browser autoplay policies.
 */
export const useAudioContextManager = () => {
    useEffect(() => {
        const safelyResumeAudio = () => {
            const context = getAudioContext();
            // Only attempt to resume if the context exists and is suspended.
            if (context && context.state === 'suspended') {
                resumeAudioContext();
            }
        };

        // Listen for the first user interaction to unlock the audio context.
        const events: (keyof WindowEventMap)[] = ['click', 'touchstart', 'keydown'];
        
        events.forEach(event => {
            window.addEventListener(event, safelyResumeAudio, { once: true });
        });

        // Cleanup the event listeners when the component unmounts.
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, safelyResumeAudio);
            });
        };
    }, []); // This effect should only run once on component mount.
};