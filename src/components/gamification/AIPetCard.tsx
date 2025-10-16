// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import type { AIPetState } from '../../types';

interface Props { 
    petState: AIPetState;
}

const AIPetCard: React.FC<Props> = ({ petState }) => {
    return (
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-4 rounded-lg text-center shadow-inner">
            <img src={petState.image_url} alt={petState.name} className="w-32 h-32 mx-auto mb-3 object-contain" />
            <h4 className="font-bold text-text-header">{petState.name}</h4>
            <p className="text-xs text-text-muted capitalize">{petState.species} - {petState.stage}</p>
        </div>
    );
};

export default AIPetCard;
