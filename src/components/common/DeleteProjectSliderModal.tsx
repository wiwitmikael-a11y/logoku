// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const DeleteProjectSliderModal: React.FC<{ show: boolean; onClose: () => void; onDelete: () => void; }> = ({ show, onClose, onDelete }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full">
                <h2 className="text-xl font-bold text-red-500">Delete Project?</h2>
                <p className="text-text-body mt-2">This action is irreversible. Slide to confirm.</p>
                {/* Dummy slider for now */}
                <div className="mt-4 flex gap-4">
                    <button onClick={onDelete} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg">Yes, Delete</button>
                    <button onClick={onClose} className="w-full px-4 py-2 bg-background text-text-body rounded-lg">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteProjectSliderModal;
