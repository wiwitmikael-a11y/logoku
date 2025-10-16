// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import type { Achievement } from '../../types';
import { playSound } from '../../services/soundService';

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

const AchievementToast: React.FC<Props> = ({ achievement, onDismiss }) => {
    useEffect(() => {
        playSound('success');
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-5 right-5 bg-surface shadow-lg rounded-lg p-4 flex items-center gap-4 z-50 animate-content-fade-in border-l-4 border-accent">
            <div className="text-4xl">{achievement.icon}</div>
            <div>
                <p className="font-bold text-text-header">{achievement.name}</p>
                <p className="text-sm text-text-body">{achievement.description}</p>
            </div>
            <button onClick={onDismiss} className="absolute top-1 right-1 text-text-muted hover:text-text-header">&times;</button>
        </div>
    );
};

export default AchievementToast;
