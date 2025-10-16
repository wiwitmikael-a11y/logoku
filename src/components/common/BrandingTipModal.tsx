// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const BrandingTipModal: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold text-text-header">Branding Tip</h2>
                <p className="text-text-body mt-2">A great brand tells a story. What's yours?</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Got it!</button>
            </div>
        </div>
    );
};

export default BrandingTipModal;
