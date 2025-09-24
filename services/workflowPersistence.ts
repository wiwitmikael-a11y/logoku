import type { ProjectData } from '../types';

const WORKFLOW_STATE_KEY = 'logoku_workflow_state';

/**
 * Saves the current workflow state to sessionStorage.
 * @param state The partial or complete project data to save.
 */
export const saveWorkflowState = (state: Partial<ProjectData>): void => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem(WORKFLOW_STATE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save workflow state to sessionStorage:", error);
  }
};

/**
 * Loads the workflow state from sessionStorage.
 * @returns The parsed project data or null if not found or on error.
 */
export const loadWorkflowState = (): Partial<ProjectData> | null => {
  try {
    const serializedState = sessionStorage.getItem(WORKFLOW_STATE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Could not load workflow state from sessionStorage:", error);
    return null;
  }
};

/**
 * Clears the workflow state from sessionStorage.
 */
export const clearWorkflowState = (): void => {
  try {
    sessionStorage.removeItem(WORKFLOW_STATE_KEY);
  } catch (error) {
    console.error("Could not clear workflow state from sessionStorage:", error);
  }
};
