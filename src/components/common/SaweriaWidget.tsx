// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const SaweriaWidget: React.FC = () => {
    // This would typically involve an iframe or script from Saweria
    return (
        <div className="p-4 bg-surface rounded-lg">
            <h3 className="font-bold text-text-header">Support the Developer</h3>
            <p className="text-sm text-text-body mt-2">If you find this tool useful, consider buying me a coffee!</p>
            <a href="https://saweria.co/ranggaph" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block px-4 py-2 bg-accent text-white rounded-lg">Donate via Saweria</a>
        </div>
    );
};

export default SaweriaWidget;
