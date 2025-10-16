// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    return (
        <div className={`bg-surface rounded-lg shadow p-4 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
