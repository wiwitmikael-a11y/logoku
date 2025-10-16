// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { LevelUpInfo } from '../../types';
import Button from '../common/Button';

interface Props {
  show: boolean;
  onClose: () => void;
  levelUpInfo: LevelUpInfo;
}

const LevelUpModal: React.FC<Props> = ({ show, onClose, levelUpInfo }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
                <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Naik Level!</h2>
                <p className="text-5xl font-bold text-orange-400 mb-4">Level {levelUpInfo.newLevel}</p>
                <p className="text-text-body mb-1">Selamat, Juragan! Anda telah mencapai level baru.</p>
                <p className="font-semibold text-green-400 mb-6">Hadiah: {levelUpInfo.reward}</p>
                <Button onClick={onClose} variant="accent">Mantap!</Button>
            </div>
        </div>
    );
};

export default LevelUpModal;
