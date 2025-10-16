// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => {
    return (
        <div className="relative group">
            {children}
            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {text}
            </div>
        </div>
    );
};

export default Tooltip;
