// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const VoiceVisualizer: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-16 w-full bg-surface rounded-lg">
            <div className="w-2 h-4 bg-primary rounded-full animate-bounce mx-1"></div>
            <div className="w-2 h-8 bg-primary rounded-full animate-bounce mx-1" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-4 bg-primary rounded-full animate-bounce mx-1" style={{ animationDelay: '0.4s' }}></div>
        </div>
    );
};

export default VoiceVisualizer;
