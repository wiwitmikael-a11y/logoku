// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { Profile } from '../../types';

interface HeaderStatsProps {
  profile: Profile | null;
}

// XP needed to get to a certain level
const getXpForLevel = (level: number): number => (level - 1) * 750;

const HeaderStats: React.FC<HeaderStatsProps> = ({ profile }) => {
  if (!profile) {
    return null;
  }

  const currentLevel = profile.level ?? 1;
  const currentXp = profile.xp ?? 0;
  
  // XP needed to reach the start of the current level
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  // XP needed to reach the start of the next level
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  
  // How much XP has been gained within the current level
  const xpProgress = currentXp - xpForCurrentLevel;
  // Total XP needed to pass the current level
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  
  const progressPercentage = xpNeededForLevel > 0 ? (xpProgress / xpNeededForLevel) * 100 : 100;

  return (
    <div className="flex items-center gap-3">
        <div className="bg-yellow-400 text-gray-900 rounded-full w-9 h-9 flex flex-col items-center justify-center font-bold flex-shrink-0 p-1" title={`Level ${currentLevel}`}>
            <span className="text-[10px] leading-tight -mb-0.5">LVL</span>
            <span className="text-lg leading-tight">{currentLevel}</span>
        </div>
        <div className="hidden sm:block w-32" title={`${xpProgress.toLocaleString()} / ${xpNeededForLevel.toLocaleString()} XP`}>
             <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full xp-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">{currentXp.toLocaleString()} XP</p>
        </div>
    </div>
  );
};

export default HeaderStats;