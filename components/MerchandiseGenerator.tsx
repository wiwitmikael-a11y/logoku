import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateMerchandiseMockup } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../contexts/UserActionsContext';
import type { ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import Card from './common/Card';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (merchandiseUrl: string) => void;
  onGoToDashboard: () => void;
}

type MerchType = 't-shirt' | 'mug' | 'tote-bag';
const GENERATION_COST = 1;

const merchandiseTypes: { id: MerchType; name: string; prompt: string }[] = [
  { id: 't-shirt', name: 'T-Shirt', prompt: 'Take the provided logo image. Create a realistic mockup