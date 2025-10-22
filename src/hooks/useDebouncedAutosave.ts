// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import type { Project } from '../types';

export const useDebouncedAutosave = (project: Project | null, delay = 2000) => {
    const isSavingRef = useRef(false);
    // Use a ref to store the project data to avoid re-triggering the effect on every change
    const projectRef = useRef(project);
    projectRef.current = project;

    useEffect(() => {
        if (!project) return;

        const handler = setTimeout(async () => {
            if (isSavingRef.current) return;
            
            // Access the latest project data from the ref
            const projectToSave = projectRef.current;
            if (!projectToSave) return;

            isSavingRef.current = true;
            window.dispatchEvent(new CustomEvent('saveStatusChanged', { detail: { isSaving: true, error: null } }));
            
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('projects')
                .update({ project_data: projectToSave.project_data })
                .eq('id', projectToSave.id);

            if (error) {
                console.error('Autosave failed:', error);
                window.dispatchEvent(new CustomEvent('saveStatusChanged', { detail: { isSaving: false, error: error.message } }));
            } else {
                 window.dispatchEvent(new CustomEvent('saveStatusChanged', { detail: { isSaving: false, error: null } }));
            }
            isSavingRef.current = false;

        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [project?.project_data, delay]); // Rerun effect only when project_data changes
};
