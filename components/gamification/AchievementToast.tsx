// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { playSound } from '../../services/soundService';
// FIX: Changed import path for Achievement type
import type { Achievement } from '../../contexts/UserActionsContext';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    if (achievement) {
      playSound('success');
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 z-50"
      style={{ animation: 'item-appear 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards', opacity: 0 }}
      role="status"
      aria-live="assertive"
    >
      <div className="bg-surface/80 backdrop-blur-md border border-border-main rounded-xl shadow-2xl p-4 flex items-center gap-4">
        <div className="text-5xl flex-shrink-0">{achievement.icon}</div>
        <div>
            <p className="text-xs text-splash font-semibold">Pencapaian Terbuka!</p>
            <p className="font-bold text-text-header">{achievement.name}</p>
            <p className="text-xs text-text-body">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;