import { isBase64DataUrl } from '../utils/imageUtils';
import type { Project, ProjectData } from '../types';

/**
 * @deprecated This function is deprecated. All image assets are now stored as Base64 data URLs directly within the project_data JSONB field. No external uploads are performed during the wizard workflow.
 */
export const uploadImageFromBase64 = async (): Promise<string> => {
    console.warn('uploadImageFromBase64 is deprecated and should not be used. Image data is now stored as Base64.');
    throw new Error('This function is deprecated.');
};

export type ProgressStatus = 'pending' | 'uploading' | 'complete' | 'error';
export interface ProgressUpdate {
  assetKey: string;
  assetName: string;
  status: ProgressStatus;
  message?: string;
}
export type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * @deprecated This function is deprecated. All image assets are now stored as Base64 data URLs. There is no longer a separate sync process for assets.
 */
export const uploadAndSyncProjectAssets = async (project: Project, onProgress: ProgressCallback): Promise<ProjectData> => {
    console.warn('uploadAndSyncProjectAssets is deprecated and should not be used. Sync process has been removed.');
    throw new Error('This function is deprecated.');
};