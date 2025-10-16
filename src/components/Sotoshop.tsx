// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const Sotoshop: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-4xl w-full">
                <h2 className="text-xl font-bold text-text-header">Sotoshop - AI Playground</h2>
                <p className="text-text-body mt-2">This feature is coming soon! A creative space to generate and edit images.</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Close</button>
            </div>
        </div>
    );
};

export default Sotoshop;
