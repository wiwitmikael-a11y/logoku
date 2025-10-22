// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useState, useEffect, useRef } from 'react';
import type { Project, ProjectData } from '../types';

type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'SAVED';

/**
 * Custom hook that automatically saves project data after a delay when changes are detected.
 * @param project The current project object.
 * @param onUpdateProject The function to call to save the data.
 * @param delay The debounce delay in milliseconds.
 * @returns The current save status.
 */
export const useDebouncedAutosave = (
  project: Project | null,
  onUpdateProject: (data: Partial<ProjectData>) => Promise<void>,
  delay = 2500 // 2.5 seconds
): SaveStatus => {
  const [status, setStatus] = useState<SaveStatus>('IDLE');
  const timeoutRef = useRef<number | null>(null);
  
  // Ref to store the latest version of the update function
  const onUpdateProjectRef = useRef(onUpdateProject);
  useEffect(() => {
    onUpdateProjectRef.current = onUpdateProject;
  }, [onUpdateProject]);

  // Use a ref to track the previous project data
  // FIX: Moved `useRef` outside of the `useEffect` hook to comply with the Rules of Hooks.
  // This ensures the ref persists across re-renders for correct change detection.
  // FIX: Initialize useRef with an argument to satisfy the linter/compiler expecting one.
  const prevProjectDataRef = useRef<ProjectData | undefined>(project?.project_data);

  useEffect(() => {
    if (!project) {
      setStatus('IDLE');
      return;
    }

    // Function to compare if project data has actually changed
    const hasChanged = (prevData: ProjectData | undefined, nextData: ProjectData) => {
        return JSON.stringify(prevData) !== JSON.stringify(nextData);
    };

    if (hasChanged(prevProjectDataRef.current, project.project_data)) {
        setStatus('DIRTY');

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(async () => {
            setStatus('SAVING');
            try {
                // We only need to save project_data, no need to pass the whole project object
                await onUpdateProjectRef.current(project.project_data);
                setStatus('SAVED');
                // Hide "Saved" message after a few seconds
                // FIX: Add `window.` to `setTimeout` to ensure the browser's implementation is used, avoiding potential conflicts with Node.js types.
                window.setTimeout(() => setStatus('IDLE'), 2000);
            } catch (error) {
                console.error("Autosave failed:", error);
                // Handle error state if needed, e.g., setStatus('ERROR');
            }
        }, delay);

        // Update the ref to the current data for the next comparison
        prevProjectDataRef.current = project.project_data;
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project, delay]);

  return status;
};
