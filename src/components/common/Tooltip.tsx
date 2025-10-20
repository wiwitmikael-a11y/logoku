// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => {
    return (
        <div className="relative group">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-background text-text-header text-xs font-semibold rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg pointer-events-none z-10">
                {text}
            </div>
        </div>
    );
};

export default Tooltip;