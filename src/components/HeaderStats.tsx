// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from './common/Tooltip';

const HeaderStats: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  // Calculate XP progress for the progress bar
  const xpForNextLevel = 100 * Math.pow(profile.level, 1.5); // Example formula, should match backend
  const xpProgress = (profile.xp / xpForNextLevel) * 100;

  return (
    <div className="flex items-center gap-4 text-sm">
      <Tooltip text={`${profile.credits} Token`}>
        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-text-header">{profile.credits}</span>
        </div>
      </Tooltip>
      
      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full">
        <Tooltip text={`Level ${profile.level}`}>
            <span className="font-bold text-primary">LVL ${profile.level}</span>
        </Tooltip>
        <div className="w-24 bg-background rounded-full h-2.5 overflow-hidden">
            <Tooltip text={`${profile.xp.toFixed(0)} / ${xpForNextLevel.toFixed(0)} XP`}>
                 <div className="bg-accent h-2.5 rounded-full" style={{ width: `${xpProgress}%` }}></div>
            </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default HeaderStats;
