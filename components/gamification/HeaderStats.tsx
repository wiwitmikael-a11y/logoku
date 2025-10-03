// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Profile } from '../../types';

interface HeaderStatsProps {
  profile: Profile | null;
}

const getXpForLevel = (level: number): number => (level - 1) * 750;

const HeaderStats: React.FC<HeaderStatsProps> = ({ profile }) => {
  if (!profile) return null;

  const currentLevel = profile.level ?? 1;
  const currentXp = profile.xp ?? 0;
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const xpProgress = currentXp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeededForLevel > 0 ? (xpProgress / xpNeededForLevel) * 100 : 100;

  return (
    <div className="flex items-center gap-2 text-text-body">
      <div className="bg-orange-400 text-white rounded-full w-8 h-8 flex flex-col items-center justify-center font-bold flex-shrink-0 p-1" title={`Level ${currentLevel}`}>
        <span className="text-[9px] leading-tight -mb-1">LVL</span>
        <span className="text-base leading-tight">{currentLevel}</span>
      </div>
      <div className="w-16 hidden sm:block" title={`${xpProgress.toLocaleString()} / ${xpNeededForLevel.toLocaleString()} XP`}>
        <div className="w-full bg-border-main rounded-full h-1.5">
          <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <p className="text-[10px] text-text-muted text-center mt-0.5">{currentXp.toLocaleString()} XP</p>
      </div>
    </div>
  );
};

export default HeaderStats;