// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { playSound } from '../../services/soundService';
import type { Achievement } from '../../contexts/AuthContext';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    if (achievement) {
      playSound('success');
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 z-50"
      style={{ animation: 'achievement-toast-slide-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}
      role="status"
      aria-live="assertive"
    >
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-4 flex items-center gap-4">
        <div className="text-5xl flex-shrink-0">{achievement.icon}</div>
        <div>
            <p className="text-xs text-orange-500 font-semibold">Pencapaian Terbuka!</p>
            <p className="font-bold text-slate-800">{achievement.name}</p>
            <p className="text-xs text-slate-600">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;